import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailProps {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

export const sendEmail = async (props: SendEmailProps) => {
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
