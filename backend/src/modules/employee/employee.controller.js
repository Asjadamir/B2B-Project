import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import queries from "./employee.queries.js";
import logAudit from "../../utils/audit.js";
import env from "../../config/env.js";
import asyncHandler from "../../utils/asyncHandler.js";

const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
    },
});

const MANAGING_ROLES = ["Owner", "Manager"];

const employeeControllers = {
    getMyRole: asyncHandler(async (req, res) => {
        const { businessId } = req.query;
        const userId = req.user.userId;

        if (!businessId) {
            return res.status(400).json({ message: "businessId query param is required." });
        }

        const record = await queries.getMyRole(userId, businessId);
        if (!record) {
            return res.status(403).json({ message: "You are not a member of this business." });
        }

        return res.status(200).json({ role: record.RoleName });
    }),

    sendInvite: asyncHandler(async (req, res) => {
        const { businessId, email, roleId } = req.body;
        const userId = req.user.userId;

        if (!businessId || !email || !roleId) {
            return res.status(400).json({ message: "businessId, email, and roleId are required." });
        }

        const staffRecord = await queries.getStaffRecord(userId, businessId);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
            return res.status(403).json({ message: "Only Owner or Manager can send invitations." });
        }

        const role = await queries.getRoleById(roleId);
        if (!role) {
            return res.status(400).json({ message: "Invalid role." });
        }
        if (role.RoleName === "Owner") {
            return res.status(400).json({ message: "Cannot invite someone as Owner." });
        }

        const existingUser = await queries.findUserByEmail(email);
        if (existingUser) {
            const alreadyMember = await queries.isAlreadyStaff(existingUser.UserID, businessId);
            if (alreadyMember) {
                return res.status(409).json({ message: "This user is already a member of the business." });
            }
        }

        const pendingInvite = await queries.findPendingInvite(email, businessId);
        if (pendingInvite) {
            return res.status(409).json({ message: "An invitation has already been sent to this email." });
        }

        const business = await queries.getBusinessById(businessId);
        const token = crypto.randomBytes(32).toString("hex");
        await queries.createInvite(email, businessId, roleId, userId, token);

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

        await logAudit({ businessId, actorId: userId, action: "SEND_INVITE", entityType: "Employee", entityId: null, details: `Invited ${email} as ${role.RoleName}.` });
        return res.status(200).json({ message: "Invitation sent successfully." });
    }),

    getInviteInfo: asyncHandler(async (req, res) => {
        const { token } = req.params;

        const invite = await queries.findInviteByToken(token);
        if (!invite) {
            return res.status(404).json({ message: "Invalid invitation link." });
        }
        if (invite.Status !== "Pending") {
            return res.status(400).json({ message: "This invitation has already been used." });
        }
        if (new Date() > new Date(invite.ValidTill)) {
            return res.status(400).json({ message: "This invitation link has expired." });
        }

        const existingUser = await queries.findUserByEmail(invite.Email);
        return res.status(200).json({
            email:          invite.Email,
            businessName:   invite.BusinessName,
            roleName:       invite.RoleName,
            isExistingUser: !!existingUser,
        });
    }),

    acceptInvite: asyncHandler(async (req, res) => {
        const { token } = req.params;
        const { fullName, password } = req.body;

        if (!password) {
            return res.status(400).json({ message: "Password is required." });
        }

        const invite = await queries.findInviteByToken(token);
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
        const existingUser = await queries.findUserByEmail(invite.Email);

        if (existingUser) {
            const isMatch = await bcrypt.compare(password, existingUser.PasswordHash);
            if (!isMatch) {
                return res.status(401).json({ message: "Incorrect password." });
            }
            const alreadyMember = await queries.isAlreadyStaff(existingUser.UserID, invite.BusinessID);
            if (alreadyMember) {
                return res.status(409).json({ message: "You are already a member of this business." });
            }
            userId = existingUser.UserID;
        } else {
            if (!fullName) {
                return res.status(400).json({ message: "fullName is required for new accounts." });
            }
            const passwordHash = await bcrypt.hash(password, 12);
            userId = await queries.createVerifiedUser(fullName, invite.Email, passwordHash);
        }

        await queries.addToStaff(userId, invite.BusinessID, invite.RoleID);
        await queries.markInviteAccepted(invite.RequestID);

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

        await logAudit({ businessId: invite.BusinessID, actorId: userId, action: "ACCEPT_INVITE", entityType: "Employee", entityId: userId, details: `${invite.Email} accepted invitation and joined as ${invite.RoleName}.` });
        return res.status(200).json({ message: `Welcome to ${invite.BusinessName}!`, email: invite.Email });
    }),

    getEmployees: asyncHandler(async (req, res) => {
        const { businessId } = req.query;
        const userId = req.user.userId;

        if (!businessId) {
            return res.status(400).json({ message: "businessId query param is required." });
        }

        const staffRecord = await queries.getStaffRecord(userId, businessId);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }

        const employees = await queries.getEmployeesByBusiness(businessId);
        return res.status(200).json({ employees });
    }),

    updateRole: asyncHandler(async (req, res) => {
        const { staffId } = req.params;
        const { roleId } = req.body;
        const userId = req.user.userId;

        if (!roleId) {
            return res.status(400).json({ message: "roleId is required." });
        }

        const target = await queries.getStaffById(staffId);
        if (!target || !target.IsActive) {
            return res.status(404).json({ message: "Employee not found." });
        }

        const callerRecord = await queries.getStaffRecord(userId, target.BusinessID);
        if (!callerRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGING_ROLES.includes(callerRecord.RoleName)) {
            return res.status(403).json({ message: "Only Owner or Manager can update roles." });
        }
        if (target.RoleName === "Owner") {
            return res.status(403).json({ message: "Cannot change the Owner's role." });
        }

        const newRole = await queries.getRoleById(roleId);
        if (!newRole) {
            return res.status(400).json({ message: "Invalid role." });
        }
        if (newRole.RoleName === "Owner") {
            return res.status(403).json({ message: "Cannot assign the Owner role." });
        }
        if (target.RoleName === "Manager" && callerRecord.RoleName !== "Owner") {
            return res.status(403).json({ message: "Only the Owner can change a Manager's role." });
        }

        await queries.updateStaffRole(staffId, roleId);
        await logAudit({ businessId: target.BusinessID, actorId: userId, action: "UPDATE_ROLE", entityType: "Employee", entityId: staffId, details: `Changed role of staff #${staffId} from ${target.RoleName} to ${newRole.RoleName}.` });
        return res.status(200).json({ message: "Employee role updated successfully." });
    }),

    expel: asyncHandler(async (req, res) => {
        const { staffId } = req.params;
        const userId = req.user.userId;

        const target = await queries.getStaffById(staffId);
        if (!target || !target.IsActive) {
            return res.status(404).json({ message: "Employee not found." });
        }

        const callerRecord = await queries.getStaffRecord(userId, target.BusinessID);
        if (!callerRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGING_ROLES.includes(callerRecord.RoleName)) {
            return res.status(403).json({ message: "Only Owner or Manager can expel employees." });
        }
        if (target.RoleName === "Owner") {
            return res.status(403).json({ message: "Cannot expel the Owner." });
        }
        if (target.UserID === userId) {
            return res.status(400).json({ message: "You cannot expel yourself. Use the leave endpoint instead." });
        }
        if (target.RoleName === "Manager" && callerRecord.RoleName !== "Owner") {
            return res.status(403).json({ message: "Only the Owner can expel a Manager." });
        }

        await queries.deactivateStaff(staffId);
        await logAudit({ businessId: target.BusinessID, actorId: userId, action: "EXPEL_EMPLOYEE", entityType: "Employee", entityId: staffId, details: `Expelled staff #${staffId} (${target.RoleName}) from the business.` });
        return res.status(200).json({ message: "Employee removed from the business." });
    }),

    leave: asyncHandler(async (req, res) => {
        const { businessId } = req.body;
        const userId = req.user.userId;

        if (!businessId) {
            return res.status(400).json({ message: "businessId is required." });
        }

        const staffRecord = await queries.getStaffByUserAndBusiness(userId, businessId);
        if (!staffRecord) {
            return res.status(404).json({ message: "You are not an active member of this business." });
        }
        if (staffRecord.RoleName === "Owner") {
            return res.status(403).json({ message: "The Owner cannot leave the business. Delete the business or transfer ownership first." });
        }

        await queries.deactivateStaff(staffRecord.StaffID);
        await logAudit({ businessId, actorId: userId, action: "LEAVE_BUSINESS", entityType: "Employee", entityId: staffRecord.StaffID, details: `Left the business (was ${staffRecord.RoleName}).` });
        return res.status(200).json({ message: "You have left the business." });
    }),

    cancelInvite: asyncHandler(async (req, res) => {
        const { requestId } = req.params;
        const userId = req.user.userId;

        const invite = await queries.findInviteById(requestId);
        if (!invite) {
            return res.status(404).json({ message: "Invitation not found." });
        }
        if (invite.Status !== "Pending") {
            return res.status(400).json({ message: "Invitation is no longer pending." });
        }

        const staffRecord = await queries.getStaffRecord(userId, invite.BusinessID);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
            return res.status(403).json({ message: "Only Owner or Manager can cancel invitations." });
        }

        await queries.cancelInvite(requestId);
        await logAudit({ businessId: invite.BusinessID, actorId: userId, action: "CANCEL_INVITE", entityType: "Employee", entityId: null, details: `Cancelled invitation for ${invite.Email}.` });
        return res.status(200).json({ message: "Invitation cancelled." });
    }),

    getPendingInvites: asyncHandler(async (req, res) => {
        const { businessId } = req.query;
        const userId = req.user.userId;

        if (!businessId) {
            return res.status(400).json({ message: "businessId query param is required." });
        }

        const staffRecord = await queries.getStaffRecord(userId, businessId);
        if (!staffRecord) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!MANAGING_ROLES.includes(staffRecord.RoleName)) {
            return res.status(403).json({ message: "Only Owner or Manager can view pending invitations." });
        }

        const invites = await queries.getPendingInvites(businessId);
        return res.status(200).json({ invites });
    }),
};

export default employeeControllers;
