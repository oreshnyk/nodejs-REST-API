const sendVerificationEmail = async (email, verificationToken) => {
    const ElasticEmail = require('@elasticemail/elasticemail-client');
    const { ELASTICEMAIL_API_KEY, BASE_URL } = process.env;
  
    const defaultClient = ElasticEmail.ApiClient.instance;
    const { apikey } = defaultClient.authentications;
    apikey.apiKey = ELASTICEMAIL_API_KEY;
  
    const api = new ElasticEmail.EmailsApi();
  
    const emailData = ElasticEmail.EmailMessageData.constructFromObject({
      Recipients: [
        new ElasticEmail.EmailRecipient(email),
      ],
      Content: {
        Body: [
          ElasticEmail.BodyPart.constructFromObject({
            ContentType: "HTML",
            Content: `<a target="_blank" href="${BASE_URL}/users/verify/${verificationToken}">Click to verify your email</a>`,
          }),
        ],
        Subject: "Email Verification Required",
        From: "alexeyreshetnik5@gmail.com",
      },
    });
  
    const callback = function (error, data, response) {
      if (error) {
        console.error(error);
      } else {
        console.log('Email verification sent successfully.');
      }
    };
  
    api.emailsPost(emailData, callback);
  };
  
  module.exports = {
    sendVerificationEmail,
  };
  