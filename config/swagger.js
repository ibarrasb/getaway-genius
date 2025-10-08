import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Getaway Genius API',
      version: '1.0.0',
      description: 'API documentation for Getaway Genius travel planning application',
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === 'production'
            ? 'https://getawaygenius-app-4fd57cb7099c.herokuapp.com'
            : 'http://localhost:5001',
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js', './controllers/*.js'],
};

export default swaggerJsdoc(options);
