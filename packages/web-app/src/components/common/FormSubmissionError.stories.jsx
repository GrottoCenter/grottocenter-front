import FormSubmissionError from './FormSubmissionError';

const meta = {
  title: 'Common/FormSubmissionError',
  component: FormSubmissionError
};
export default meta;
export const Validation = {
  args: {
    error: {
      status: 400,
      body: {
        message: 'Please review your organization.',
        metadata: { details: [{ message: 'Choose an organization type.' }] }
      }
    }
  }
};
export const ServerFailure = {
  args: { error: { status: 500, message: 'Internal information is hidden' } }
};
