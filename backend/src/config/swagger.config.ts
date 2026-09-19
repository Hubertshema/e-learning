/**
 * OpenAPI 3.0.0 Specification for FluentEdge Academy API
 */
export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'FluentEdge Academy English Learning Platform REST API',
    version: '1.0.0',
    description:
      'Production-grade RESTful API for English Learning & Teacher Management Platform with 3-role RBAC (SUPERADMIN, TEACHER, STUDENT), CEFR curriculum engine, interactive multi-skill exercises, payment verifications, and public certificate validation.',
    contact: {
      name: 'FluentEdge API Support',
      email: 'api@fluentedge.edu',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server',
    },
    {
      url: 'https://api.fluentedge.edu/api/v1',
      description: 'Production API Gateway',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide JWT access token in authorization header format: Bearer <token>',
      },
    },
    schemas: {
      StandardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation or execution error message' },
          code: { type: 'string', example: 'UNAUTHORIZED' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string', enum: ['SUPERADMIN', 'TEACHER', 'STUDENT'] },
          status: { type: 'string', enum: ['ACTIVE', 'PENDING', 'SUSPENDED', 'INACTIVE'] },
          bio: { type: 'string' },
          phoneNumber: { type: 'string' },
          country: { type: 'string' },
          avatarUrl: { type: 'string' },
          timezone: { type: 'string' },
          language: { type: 'string' },
        },
      },
      Course: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          level: { type: 'string', enum: ['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
          currency: { type: 'string', example: 'USD' },
          status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
        },
      },
      PlatformSettings: {
        type: 'object',
        properties: {
          platformName: { type: 'string', example: 'FluentEdge Academy' },
          supportEmail: { type: 'string', example: 'support@fluentedge.edu' },
          enableRegistration: { type: 'boolean', example: true },
          maintenanceMode: { type: 'boolean', example: false },
          smtpHost: { type: 'string', example: 'smtp.gmail.com' },
          smtpPort: { type: 'number', example: 465 },
          smtpUser: { type: 'string', example: 'notifications@gmail.com' },
          smtpFrom: { type: 'string', example: 'FluentEdge Academy <notifications@gmail.com>' },
        },
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Log in with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@englishplatform.com' },
                  password: { type: 'string', example: 'Admin123!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authentication successful with JWT tokens' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/register/student': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new student account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Student registered successfully' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Request password reset email token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password reset token dispatched via email' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Reset account password with token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password updated successfully' },
        },
      },
    },
    '/users/profile': {
      get: {
        tags: ['User & Profile Settings'],
        summary: 'Get current user profile and settings',
        responses: {
          200: { description: 'User profile retrieved successfully' },
        },
      },
      put: {
        tags: ['User & Profile Settings'],
        summary: 'Update personal profile details',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  bio: { type: 'string' },
                  phoneNumber: { type: 'string' },
                  country: { type: 'string' },
                  timezone: { type: 'string' },
                  language: { type: 'string' },
                  notificationsEmail: { type: 'boolean' },
                  notificationsSMS: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profile updated successfully' },
        },
      },
    },
    '/users/change-password': {
      post: {
        tags: ['User & Profile Settings'],
        summary: 'Change password with current password confirmation',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password changed successfully' },
        },
      },
    },
    '/users/sessions': {
      get: {
        tags: ['User & Profile Settings'],
        summary: 'List active device sessions',
        responses: {
          200: { description: 'Active sessions retrieved' },
        },
      },
      delete: {
        tags: ['User & Profile Settings'],
        summary: 'Revoke and terminate all other device sessions',
        responses: {
          200: { description: 'All other sessions terminated' },
        },
      },
    },
    '/superadmin/settings': {
      get: {
        tags: ['Superadmin Settings'],
        summary: 'Get global platform configuration and SMTP gateway status',
        responses: {
          200: { description: 'Platform settings retrieved' },
        },
      },
      put: {
        tags: ['Superadmin Settings'],
        summary: 'Update platform settings and SMTP credentials',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PlatformSettings',
              },
            },
          },
        },
        responses: {
          200: { description: 'Settings updated successfully' },
        },
      },
    },
    '/superadmin/email/test': {
      post: {
        tags: ['Superadmin Settings'],
        summary: 'Send a diagnostic test email via configured SMTP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['targetEmail'],
                properties: {
                  targetEmail: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Test email delivered successfully' },
        },
      },
    },
    '/public/certificates/{code}': {
      get: {
        tags: ['Public Verification'],
        summary: 'Publicly verify an issued certificate by code',
        parameters: [
          {
            name: 'code',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'ENG-2026-X7Y9' },
          },
        ],
        responses: {
          200: { description: 'Certificate verified' },
          404: { description: 'Certificate not found' },
        },
      },
    },
    '/public/stats': {
      get: {
        tags: ['Public Verification'],
        summary: 'Get public platform metrics for homepage',
        responses: {
          200: { description: 'Platform stats retrieved' },
        },
      },
    },
    '/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Get authenticated user notifications',
        responses: {
          200: { description: 'Notifications list retrieved' },
        },
      },
    },
    '/activities/{id}/submit': {
      post: {
        tags: ['Learning Engine'],
        summary: 'Submit interactive activity score and persist progress',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['score', 'maxScore'],
                properties: {
                  score: { type: 'number' },
                  maxScore: { type: 'number' },
                  answers: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Activity progress persisted' },
        },
      },
    },
  },
};

/**
 * Generates Swagger UI Standalone HTML
 */
export function getSwaggerHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FluentEdge Academy API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.11.0/favicon-32x32.png" />
  <style>
    body { margin: 0; background: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .topbar { display: none; }
    .swagger-ui { max-width: 1400px; margin: 0 auto; padding: 24px; }
    .swagger-ui .info { margin: 24px 0 32px; background: #1e293b; padding: 24px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); }
    .swagger-ui .info .title { color: #38bdf8; font-size: 32px; font-weight: 800; }
    .swagger-ui .info p { color: #94a3b8; font-size: 15px; line-height: 1.6; }
    .swagger-ui .scheme-container { background: #1e293b; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); padding: 16px; margin-bottom: 24px; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "/api/docs/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;
}
