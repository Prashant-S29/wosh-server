import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

let resend: Resend | null = null;

// Only initialize Resend if API key is provided
if (apiKey) {
  resend = new Resend(apiKey);
}

interface SendEmailProps {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

export const sendEmail = async (props: SendEmailProps) => {
  if (!resend) {
    console.log('Resend API key not configured');
    return {
      data: null,
      error: 'RESEND_NOT_CONFIGURED',
      message: 'Resend email service is not configured',
    };
  }

  const { data, error } = await resend.emails.send(props);

  if (error) {
    console.log('Error sending email', error);
    return {
      data: null,
      error: error.name,
      message: error.message,
    };
  }

  return {
    data: data,
    error: null,
    message: 'Email sent successfully',
  };
};
