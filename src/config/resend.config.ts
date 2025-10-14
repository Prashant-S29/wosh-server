import { Resend } from 'resend';

let resend: Resend | null = null;

const getResendClient = (): Resend | null => {
  if (resend !== null) {
    return resend;
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log('Resend API key not configured');
    return null;
  }

  resend = new Resend(apiKey);
  console.log('✅ Resend client initialized successfully');
  return resend;
};

interface SendEmailProps {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

export const sendEmail = async (props: SendEmailProps) => {
  const client = getResendClient();

  if (!client) {
    console.log('Resend API key not configured');
    return {
      data: null,
      error: 'RESEND_NOT_CONFIGURED',
      message: 'Resend email service is not configured',
    };
  }

  const { data, error } = await client.emails.send(props);

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
