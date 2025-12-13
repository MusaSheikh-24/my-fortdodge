import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { subject, to, from, text, html, formName } = body || {};

        // Check if email is configured with detailed error messages
        if (!env.isEmailConfigured) {
            const emailConfig = env.email;
            const missing: string[] = [];
            
            if (!emailConfig?.smtpHost) missing.push("SMTP_HOST");
            if (!emailConfig?.smtpUser) missing.push("SMTP_USER");
            if (!emailConfig?.smtpPass) missing.push("SMTP_PASS");
            if (!emailConfig?.from) missing.push("EMAIL_FROM");
            if (!emailConfig?.to) missing.push("EMAIL_TO");
            
            return NextResponse.json({ 
                error: "SMTP not configured on server",
                missing: missing,
                message: `Missing required environment variables: ${missing.join(", ")}`
            }, { status: 500 });
        }

        const emailConfig = env.email!;
        const host = emailConfig.smtpHost!;
        const port = emailConfig.smtpPort || 587;
        const user = emailConfig.smtpUser!;
        const pass = emailConfig.smtpPass!;

        // Create transporter with better error handling and TLS options
        const transporter = nodemailer.createTransport({
            host,
            port: Number(port),
            secure: port === 465, // true for 465, false for other ports
            auth: {
                user,
                pass,
            },
            tls: {
                // Do not fail on invalid certificates
                rejectUnauthorized: false,
            },
            // For ports other than 465, require TLS
            requireTLS: port !== 465 && port !== 25,
        });

        // Verify connection before sending
        try {
            await transporter.verify();
            console.log("[email] SMTP connection verified successfully");
        } catch (verifyError: any) {
            console.error("[email] SMTP verification failed:", verifyError);
            return NextResponse.json({ 
                error: "SMTP connection failed",
                details: verifyError?.message || String(verifyError),
                message: "Unable to connect to SMTP server. Please check your SMTP configuration."
            }, { status: 500 });
        }

        const mailOptions = {
            from: from || emailConfig.from || user,
            to: to || emailConfig.to || user,
            subject: subject || `Website form submission${formName ? ` — ${formName}` : ""}`,
            text: text || undefined,
            html: html || undefined,
        };

        // Remove undefined fields
        if (!mailOptions.text) delete (mailOptions as any).text;
        if (!mailOptions.html) delete (mailOptions as any).html;

        console.log("=== Sending Email Debug ===");
        console.log("SMTP Host:", host);
        console.log("SMTP Port:", port);
        console.log("SMTP User:", user);
        console.log("To:", mailOptions.to);
        console.log("From:", mailOptions.from);
        console.log("Subject:", mailOptions.subject);
        console.log("Has text:", !!mailOptions.text);
        console.log("Has html:", !!mailOptions.html);
        console.log("===========================");

        const info = await transporter.sendMail(mailOptions);

        console.log("[email] Email sent successfully:", info.messageId);

        return NextResponse.json({ ok: true, info });
    } catch (err: any) {
        console.error("[email] Error sending email:", err);
        
        // Provide more detailed error information
        let errorMessage = err?.message || String(err);
        let errorDetails = err?.code || err?.responseCode || "Unknown error";
        
        // Common SMTP error codes
        if (err?.code === "EAUTH") {
            errorMessage = "SMTP authentication failed. Please check your SMTP_USER and SMTP_PASS.";
        } else if (err?.code === "ECONNECTION") {
            errorMessage = "Could not connect to SMTP server. Please check your SMTP_HOST and SMTP_PORT.";
        } else if (err?.code === "ETIMEDOUT") {
            errorMessage = "SMTP connection timed out. Please check your network connection and SMTP settings.";
        }
        
        return NextResponse.json({ 
            error: errorMessage,
            details: errorDetails,
            code: err?.code,
        }, { status: 500 });
    }
}
