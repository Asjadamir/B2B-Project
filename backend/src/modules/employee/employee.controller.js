import bcrypt from "bcryptjs";
import logAudit from "../../utils/audit.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import queries from "./employee.queries.js";
import env from "../../config/env.js";

// ── Email sender ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
    },
});

const MANAGING_ROLES = ["Owner", "Manager"];

const employeeControllers = (pool) => {
    const {
        getStaffRecord,
        getBusinessById,
        getRoleById,
        findPendingInvite,
        isAlreadyStaff,
        createInvite,
        findInviteByToken,
        findUserByEmail,
        createVerifiedUser,
        addToStaff,
        markInviteAccepted,
        getEmployeesByBusiness,
        getPendingInvites,
        getStaffById,
        getStaffByUserAndBusiness,
        updateStaffRole,
        deactivateStaff,
    } = queries(pool);

    return {
        // ── SEND INVITATION ──────────────────────────────────────────
        // POST /api/employee/invite
        sendInvite: async (req, res) => {
            try {
                const { businessId, email, roleId } = req.body;
                const userId = req.user.userId;

                if (!businessId || !email || !roleId) {
                    return res.status(400).json({ message: "businessId, email, and roleId are required." });
                }

                // Verify caller is active staff
                const staffRecord = await getStaffRecord(userId, businessId);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner or Manager can send invitations." });
                }

                // Validate the role being assigned
                const role = await getRoleById(roleId);
                if (!role) {
                    return res.status(400).json({ message: "Invalid role." });
                }

                // Cannot invite someone with the Owner role
                if (role.RoleName === "Owner") {
                    return res.status(400).json({ message: "Cannot invite someone as Owner." });
                }

                // Check if this email is already an active member
                const existingUser = await findUserByEmail(email);
                if (existingUser) {
                    const alreadyMember = await isAlreadyStaff(existingUser.UserID, businessId);
                    if (alreadyMember) {
                        return res.status(409).json({ message: "This user is already a member of the business." });
                    }
                }

                // Check for an existing pending invite for this email + business
                const pendingInvite = await findPendingInvite(email, businessId);
                if (pendingInvite) {
                    return res.status(409).json({ message: "An invitation has already been sent to this email." });
                }

                // Get business info for the email
                const business = await getBusinessById(businessId);

                // Generate token and save invite
                const token = crypto.randomBytes(32).toString("hex");
                await createInvite(email, businessId, roleId, userId, token);

                // Send invitation email
                const inviteUrl = `${env.FRONTEND_URL}/invite/${token}`;
                await transporter.sendMail({
                    from: env.EMAIL_USER,
                    to: email,
                    subject: `CoreChain — You've been invited to join ${business.BusinessName}`,
                    html: `
                        <h2>You're invited to join ${business.BusinessName} on CoreChain</h2>
                        <p>You have been invited as <strong>${role.RoleName}</strong>.</p>
                        <p>Click the link below to set up your account and join the team. This link expires in 48 hours.</p>
                        <a href="${inviteUrl}">${inviteUrl}</a>
                        <p>If you did not expect this invitation, you can ignore this email.</p>
                    `,
                });

                await logAudit(pool, { businessId, actorId: userId, action: "SEND_INVITE", entityType: "Employee", entityId: null, details: `Invited ${email} as ${role.RoleName}.` });
                return res.status(200).json({ message: "Invitation sent successfully." });
            } catch (error) {
                console.error("Send invite error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── VALIDATE INVITE TOKEN ────────────────────────────────────
        // GET /api/employee/invite/:token
        // Called by frontend to get invite details before showing the form
        getInviteInfo: async (req, res) => {
            try {
                const { token } = req.params;

                const invite = await findInviteByToken(token);
                if (!invite) {
                    return res.status(404).json({ message: "Invalid invitation link." });
                }

                if (invite.Status !== "Pending") {
                    return res.status(400).json({ message: "This invitation has already been used." });
                }

                if (new Date() > new Date(invite.ValidTill)) {
                    return res.status(400).json({ message: "This invitation link has expired." });
                }

                // Tell the frontend whether this email already has an account
                const existingUser = await findUserByEmail(invite.Email);

                return res.status(200).json({
                    email:        invite.Email,
                    businessName: invite.BusinessName,
                    roleName:     invite.RoleName,
                    isExistingUser: !!existingUser,
                });
            } catch (error) {
                console.error("Get invite info error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── ACCEPT INVITATION ────────────────────────────────────────
        // POST /api/employee/invite/:token/accept
        // New user:      body = { fullName, password }
        // Existing user: body = { password }
        acceptInvite: async (req, res) => {
            try {
                const { token } = req.params;
                const { fullName, password } = req.body;

                if (!password) {
                    return res.status(400).json({ message: "Password is required." });
                }

                // Re-validate the token
                const invite = await findInviteByToken(token);
                if (!invite) {
                    return res.status(404).json({ message: "Invalid invitation link." });
                }
                if (invite.Status !== "Pending") {
                    return res.status(400).json({ message: "This invitation has already been used." });
                }
                if (new Date() > new Date(invite.ValidTill)) {
                    return res.status(400).json({ message: "This invitation link has expired." });
                }

                let userId;
                const existingUser = await findUserByEmail(invite.Email);

                if (existingUser) {
                    // ── Existing user: verify password then add to business ──
                    const isMatch = await bcrypt.compare(password, existingUser.PasswordHash);
                    if (!isMatch) {
                        return res.status(401).json({ message: "Incorrect password." });
                    }

                    const alreadyMember = await isAlreadyStaff(existingUser.UserID, invite.BusinessID);
                    if (alreadyMember) {
                        return res.status(409).json({ message: "You are already a member of this business." });
                    }

                    userId = existingUser.UserID;
                } else {
                    // ── New user: create account (IsVerified = TRUE) ─────────
                    if (!fullName) {
                        return res.status(400).json({ message: "fullName is required for new accounts." });
                    }

                    const passwordHash = await bcrypt.hash(password, 12);
                    userId = await createVerifiedUser(fullName, invite.Email, passwordHash);
                }

                // Add to Staff with the role from the invite
                await addToStaff(userId, invite.BusinessID, invite.RoleID);

                // Mark invite as accepted
                await markInviteAccepted(invite.RequestID);

                // Sign JWT and set cookie — user lands directly on dashboard
                const jwtToken = jwt.sign(
                    { userId, email: invite.Email },
                    env.JWT_SECRET,
                    { expiresIn: env.JWT_EXPIRES_IN },
                );

                res.cookie("token", jwtToken, {
                    httpOnly: true,
                    secure: env.NODE_ENV === "production",
                    sameSite: "strict",
                    maxAge: 24 * 60 * 60 * 1000,
                });

                await logAudit(pool, { businessId: invite.BusinessID, actorId: userId, action: "ACCEPT_INVITE", entityType: "Employee", entityId: userId, details: `${invite.Email} accepted invitation and joined as ${invite.RoleName}.` });
                return res.status(200).json({
                    message: `Welcome to ${invite.BusinessName}!`,
                    email: invite.Email,
                });
            } catch (error) {
                console.error("Accept invite error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── GET EMPLOYEES ────────────────────────────────────────────
        // GET /api/employee?businessId=1
        getEmployees: async (req, res) => {
            try {
                const { businessId } = req.query;
                const userId = req.user.userId;

                if (!businessId) {
                    return res.status(400).json({ message: "businessId query param is required." });
                }

                const staffRecord = await getStaffRecord(userId, businessId);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }

                const employees = await getEmployeesByBusiness(businessId);
                return res.status(200).json({ employees });
            } catch (error) {
                console.error("Get employees error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── UPDATE EMPLOYEE ROLE ─────────────────────────────────────
        // PATCH /api/employee/:staffId/role
        updateRole: async (req, res) => {
            try {
                const { staffId } = req.params;
                const { roleId } = req.body;
                const userId = req.user.userId;

                if (!roleId) {
                    return res.status(400).json({ message: "roleId is required." });
                }

                const target = await getStaffById(staffId);
                if (!target || !target.IsActive) {
                    return res.status(404).json({ message: "Employee not found." });
                }

                // Caller must be active staff of the same business
                const callerRecord = await getStaffRecord(userId, target.BusinessID);
                if (!callerRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!MANAGING_ROLES.includes(callerRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner or Manager can update roles." });
                }

                // Cannot change the Owner's role
                if (target.RoleName === "Owner") {
                    return res.status(403).json({ message: "Cannot change the Owner's role." });
                }

                // Cannot assign the Owner role
                const newRole = await getRoleById(roleId);
                if (!newRole) {
                    return res.status(400).json({ message: "Invalid role." });
                }
                if (newRole.RoleName === "Owner") {
                    return res.status(403).json({ message: "Cannot assign the Owner role." });
                }

                // Manager cannot change another Manager's role — only Owner can
                if (target.RoleName === "Manager" && callerRecord.RoleName !== "Owner") {
                    return res.status(403).json({ message: "Only the Owner can change a Manager's role." });
                }

                await updateStaffRole(staffId, roleId);
                await logAudit(pool, { businessId: target.BusinessID, actorId: userId, action: "UPDATE_ROLE", entityType: "Employee", entityId: staffId, details: `Changed role of staff #${staffId} from ${target.RoleName} to ${newRole.RoleName}.` });
                return res.status(200).json({ message: "Employee role updated successfully." });
            } catch (error) {
                console.error("Update role error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── EXPEL EMPLOYEE ───────────────────────────────────────────
        // DELETE /api/employee/:staffId
        expel: async (req, res) => {
            try {
                const { staffId } = req.params;
                const userId = req.user.userId;

                const target = await getStaffById(staffId);
                if (!target || !target.IsActive) {
                    return res.status(404).json({ message: "Employee not found." });
                }

                // Caller must be active staff of the same business
                const callerRecord = await getStaffRecord(userId, target.BusinessID);
                if (!callerRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!MANAGING_ROLES.includes(callerRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner or Manager can expel employees." });
                }

                // Cannot expel the Owner
                if (target.RoleName === "Owner") {
                    return res.status(403).json({ message: "Cannot expel the Owner." });
                }

                // Cannot expel yourself — use the leave endpoint instead
                if (target.UserID === userId) {
                    return res.status(400).json({ message: "You cannot expel yourself. Use the leave endpoint instead." });
                }

                // Manager cannot expel another Manager — only Owner can
                if (target.RoleName === "Manager" && callerRecord.RoleName !== "Owner") {
                    return res.status(403).json({ message: "Only the Owner can expel a Manager." });
                }

                await deactivateStaff(staffId);
                await logAudit(pool, { businessId: target.BusinessID, actorId: userId, action: "EXPEL_EMPLOYEE", entityType: "Employee", entityId: staffId, details: `Expelled staff #${staffId} (${target.RoleName}) from the business.` });
                return res.status(200).json({ message: "Employee removed from the business." });
            } catch (error) {
                console.error("Expel employee error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── LEAVE BUSINESS ───────────────────────────────────────────
        // POST /api/employee/leave
        leave: async (req, res) => {
            try {
                const { businessId } = req.body;
                const userId = req.user.userId;

                if (!businessId) {
                    return res.status(400).json({ message: "businessId is required." });
                }

                const staffRecord = await getStaffByUserAndBusiness(userId, businessId);
                if (!staffRecord) {
                    return res.status(404).json({ message: "You are not an active member of this business." });
                }

                // Owner cannot leave — they must delete the business or transfer ownership first
                if (staffRecord.RoleName === "Owner") {
                    return res.status(403).json({ message: "The Owner cannot leave the business. Delete the business or transfer ownership first." });
                }

                await deactivateStaff(staffRecord.StaffID);
                await logAudit(pool, { businessId, actorId: userId, action: "LEAVE_BUSINESS", entityType: "Employee", entityId: staffRecord.StaffID, details: `Left the business (was ${staffRecord.RoleName}).` });
                return res.status(200).json({ message: "You have left the business." });
            } catch (error) {
                console.error("Leave business error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },

        // ── GET PENDING INVITES ──────────────────────────────────────
        // GET /api/employee/invites?businessId=1
        getPendingInvites: async (req, res) => {
            try {
                const { businessId } = req.query;
                const userId = req.user.userId;

                if (!businessId) {
                    return res.status(400).json({ message: "businessId query param is required." });
                }

                const staffRecord = await getStaffRecord(userId, businessId);
                if (!staffRecord) {
                    return res.status(403).json({ message: "Access denied." });
                }
                if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
                    return res.status(403).json({ message: "Only Owner or Manager can view pending invitations." });
                }

                const invites = await getPendingInvites(businessId);
                return res.status(200).json({ invites });
            } catch (error) {
                console.error("Get pending invites error:", error);
                return res.status(500).json({ message: "Internal server error." });
            }
        },
    };
};

export default employeeControllers;
