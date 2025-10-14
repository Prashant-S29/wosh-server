export const SignInOtpTemplate = ({
  email,
  otp,
}: {
  email: string;
  otp: string;
}) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .email-wrapper {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
          }
          .logo {
            display: inline-block;
            margin-bottom: 24px;
          }
          .logo svg {
            width: 32px;
            height: 32px;
          }
          h1 {
            font-size: 28px;
            font-weight: 700;
            margin: 16px 0;
            color: #1a1a1a;
          }
          .content {
            margin: 32px 0;
          }
          .greeting {
            font-size: 16px;
            color: #555;
            margin-bottom: 24px;
          }
          .otp-section {
            background-color: #f0f9ff;
            border-left: 4px solid #3ecf8e;
            padding: 20px;
            margin: 24px 0;
            border-radius: 4px;
          }
          .otp-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #666;
            margin-bottom: 8px;
            font-weight: 600;
          }
          .otp-code {
            font-size: 24px;
            font-weight: 700;
            color: #3ecf8e;
            letter-spacing: 2px;
            font-family: 'Courier New', monospace;
          }
          .note {
            font-size: 14px;
            color: #777;
            margin-top: 24px;
            line-height: 1.8;
          }
          .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            font-size: 13px;
            color: #888;
            text-align: center;
          }
          .link {
            color: #3ecf8e;
            text-decoration: none;
          }
          .link:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="email-wrapper">
            <div class="header">
              <div class="logo">
                <svg width="32" height="32" viewBox="0 0 62 62" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M31.6437 31C100.679 31 31.6437 100.036 31.6437 31C31.6437 100.036 -37.3919 31 31.6437 31C-37.3919 31 31.6437 -38.0356 31.6437 31C31.6437 -38.0356 100.679 31 31.6437 31Z" fill="#3ecf8e"/>
                </svg>
              </div>
              <h1>Verify your email</h1>
            </div>

            <div class="content">
              <p class="greeting">Hey ${email},</p>
              
              <p class="greeting">Use the code below to verify your email address. This OTP will expire in 5 minutes.</p>

              <div class="otp-section">
                <div class="otp-label">Your one-time password</div>
                <div class="otp-code">${otp}</div>
              </div>

              <p class="note">
                <strong>Not you?</strong> If you didn't request this code or have concerns about your account security, reach out to us at <a href="mailto:support@woshvalut.xyz" class="link">support@woshvalut.xyz</a>.
              </p>
            </div>

            <div class="footer">
              <p>This is an automated message, please don't reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};
