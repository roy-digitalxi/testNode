export default {

  // Version
  CONFIG: {
    "LINKS": [
      {
        "PLATFORM": "ANDROID",
        "LINK": "https://play.google.com/store/apps/details?id=com.orgmobilern&hl=en_CA"
      },
      {
        "PLATFORM": "IOS",
        "LINK": "https://itunes.apple.com/us/app/publishxi/id1434983463?ls=1&mt=8"
      }
    ]
  },

  // API key setup
  API_LIST: {

    "/admin/org_list": "10",
    "/admin/create_org": "10",
    "/admin/view_org": "10",
    "/admin/update_org": "10",
    "/admin/update_org_status": "10",
    "/admin/delete_org": "10",

    "/org/route": "10",

    "/manage/user_list": "10",
    "/manage/create_user": "10",
    "/manage/view_user": "10",
    "/manage/update_user": "10",
    "/manage/reset_user_password": "10",
    "/manage/update_user_roles": "10",
    "/manage/update_user_enabled": "10",
    "/manage/update_user_channel_subscribes": "10",
    "/manage/delete_user": "10",
    "/manage/delete_users": "10",
    "/manage/sync_email": "10",
    "/manage/channel_list": "10",

    "/experience/list": "10",
    "/experience/create": "10",
    "/experience/update": "10",
    "/experience/view": "10",
    "/experience/delete": "10",

    "/channel/list": "10",
    "/channel/create": "10",
    "/channel/update": "10",
    "/channel/view": "10",
    "/channel/delete": "10",
    "/channel/sync_channel_code": "10",
    "/channel/language_list": "10",

    "/stream/list": "10",
    "/stream/create": "10",
    "/stream/delete": "10",
    "/stream/pending_stream_list_by_channel_guid": "10",
    "/stream/live_stream_list_by_channel_guid": "10",

    "/user/heart_beat_v0": "10",
    "/user/heart_beat": "10",
    "/user/channel_list": "10",
    "/user/subscribe_channel_list": "10",
    "/user/subscribe_channel": "10",
    "/user/subscribe_invite_channel": "10",
    "/user/unsubscribe_channel": "10",
    "/user/subscribe_multiple_channels": "10",
    "/user/stream_list": "10",
    "/user/stream_list_v2": "10",
    "/user/mobile_view": "10",
    "/user/app_view": "10",
    "/user/view_language_v0": "10",
    "/user/view_language": "10",
    "/user/logout": "10",

    "/language/list": "10",
    "/language/create": "10",
    "/language/update": "10",
    "/language/update_default": "10",
    "/language/update_status": "10",
    "/language/view": "10",

    "/upload/file": "1",
    "/upload/update_file": "10",
    "/upload/image": "1",
    "/upload/doc_file": "10",
    "/upload/h5p": "10",

    "/xapi/auth": "10",
    "/xapi/create_statement": "10",
  },
  // =================================================
  // Keycloak
  // 1. env
  keycloakHost: 'http://35.203.121.29/auth',
  keycloakSystemUser: 'keycloak',
  keycloakSystemtPassword: 'RBBupNMrYM',
  keycloakEmailHost: 'smtp.gmail.com',
  keycloakEmailPort: '587',
  keycloakEmailUser: 'devops@digitalxi.com',
  keycloakEmailUserPassword: 'D1g1+@lXi',
  // 2. clients
  keycloakServer: 'nodejs-apiserver',
  keycloakConnect: 'nodejs-connect',
  // 3. realm roles
  keycloakRealmRoles: [
    {
      type: 'keycloakOrgAdmin',
      value: 'org-admin'
    },
    {
      type: 'keycloakContentAdmin',
      value: 'content-admin'
    },
    {
      type: 'keycloakPublishAdmin',
      value: 'publish-admin'
    },
    {
      type: 'keycloakChannelAdmin',
      value: 'channel-admin'
    },
    {
      type: 'keycloakUserManageAdmin',
      value: 'user-manage-admin'
    },
    {
      type: 'keycloakAnalyticsAdmin',
      value: 'analytics-admin'
    },
    {
      type: 'keycloakLanguageAdmin',
      value: 'language-admin'
    },
    {
      type: 'keycloakUser',
      value: 'user'
    },
  ],
  // 4. client scopes
  keycloakClientScope: 'client-attribute-scope',
  keycloakClientScopeMappers: [
    'dbUserName',
    'dbPassword',
    'orgName',
  ],
  // 5. auth scopes
  keycloakClientAuthScopes: [
    'create',
    'update',
    'view',
    'delete',
  ],
  // 6. auth resource
  keycloakClientAuthResources: [
    // 6.1 org-resource
    {
      value: 'org-resource-create',
      type: 'create',
    },
    {
      value: 'org-resource-update',
      type: 'update',
    },
    {
      value: 'org-resource-view',
      type: 'view',
    },
    {
      value: 'org-resource-delete',
      type: 'delete',
    },
    // 6.2 content-resource
    {
      value: 'content-resource-create',
      type: 'create',
    },
    {
      value: 'content-resource-update',
      type: 'update',
    },
    {
      value: 'content-resource-view',
      type: 'view',
    },
    {
      value: 'content-resource-delete',
      type: 'delete',
    },
    // 6.3 publish-resource
    {
      value: 'publish-resource-create',
      type: 'create',
    },
    {
      value: 'publish-resource-update',
      type: 'update',
    },
    {
      value: 'publish-resource-view',
      type: 'view',
    },
    {
      value: 'publish-resource-delete',
      type: 'delete',
    },
    // 6.4 channel-resource
    {
      value: 'channel-resource-create',
      type: 'create',
    },
    {
      value: 'channel-resource-update',
      type: 'update',
    },
    {
      value: 'channel-resource-view',
      type: 'view',
    },
    {
      value: 'channel-resource-delete',
      type: 'delete',
    },
    // 6.5 user-manage-resource
    {
      value: 'user-manage-resource-create',
      type: 'create',
    },
    {
      value: 'user-manage-resource-update',
      type: 'update',
    },
    {
      value: 'user-manage-resource-view',
      type: 'view',
    },
    {
      value: 'user-manage-resource-delete',
      type: 'delete',
    },
    // 6.6 analytics-resource
    {
      value: 'analytics-resource-create',
      type: 'create',
    },
    {
      value: 'analytics-resource-update',
      type: 'update',
    },
    {
      value: 'analytics-resource-view',
      type: 'view',
    },
    {
      value: 'analytics-resource-delete',
      type: 'delete',
    },
    // 6.7 language-resource
    {
      value: 'language-resource-create',
      type: 'create',
    },
    {
      value: 'language-resource-update',
      type: 'update',
    },
    {
      value: 'language-resource-view',
      type: 'view',
    },
    {
      value: 'language-resource-delete',
      type: 'delete',
    },
    // 6.8 user-resource
    {
      value: 'user-resource-create',
      type: 'create',
    },
    {
      value: 'user-resource-update',
      type: 'update',
    },
    {
      value: 'user-resource-view',
      type: 'view',
    },
    {
      value: 'user-resource-delete',
      type: 'delete',
    },
  ],
  // 7. auth policy
  keycloakClientAuthPolicies: [
    // 7.1 org-resource
    {
      type: 'org-resource-create-policy',
      roles: [
        'keycloakOrgAdmin'
      ]
    },
    {
      type: 'org-resource-update-policy',
      roles: [
        'keycloakOrgAdmin'
      ]
    },
    {
      type: 'org-resource-view-policy',
      roles: [
        'keycloakOrgAdmin'
      ]
    },
    {
      type: 'org-resource-delete-policy',
      roles: [
        'keycloakOrgAdmin'
      ]
    },
    // 7.2 content-resource
    {
      type: 'content-resource-create-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakContentAdmin'
      ]
    },
    {
      type: 'content-resource-update-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakContentAdmin'
      ]
    },
    {
      type: 'content-resource-view-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakContentAdmin'
      ]
    },
    {
      type: 'content-resource-delete-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakContentAdmin'
      ]
    },
    // 7.3 publish-resource
    {
      type: 'publish-resource-create-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakPublishAdmin'
      ]
    },
    {
      type: 'publish-resource-update-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakPublishAdmin'
      ]
    },
    {
      type: 'publish-resource-view-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakPublishAdmin'
      ]
    },
    {
      type: 'publish-resource-delete-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakPublishAdmin'
      ]
    },
    // 7.4 channel-resource
    {
      type: 'channel-resource-create-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakChannelAdmin'
      ]
    },
    {
      type: 'channel-resource-update-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakChannelAdmin'
      ]
    },
    {
      type: 'channel-resource-view-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakChannelAdmin'
      ]
    },
    {
      type: 'channel-resource-delete-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakChannelAdmin'
      ]
    },
    // 7.5 user-manage-resource
    {
      type: 'user-manage-resource-create-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakUserManageAdmin'
      ]
    },
    {
      type: 'user-manage-resource-update-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakUserManageAdmin'
      ]
    },
    {
      type: 'user-manage-resource-view-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakUserManageAdmin'
      ]
    },
    {
      type: 'user-manage-resource-delete-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakUserManageAdmin'
      ]
    },
    // 7.6 analytics-resource
    {
      type: 'analytics-resource-create-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakAnalyticsAdmin'
      ]
    },
    {
      type: 'analytics-resource-update-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakAnalyticsAdmin'
      ]
    },
    {
      type: 'analytics-resource-view-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakAnalyticsAdmin'
      ]
    },
    {
      type: 'analytics-resource-delete-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakAnalyticsAdmin'
      ]
    },
    // 7.7 language-resource
    {
      type: 'language-resource-create-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakLanguageAdmin'
      ]
    },
    {
      type: 'language-resource-update-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakLanguageAdmin'
      ]
    },
    {
      type: 'language-resource-view-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakLanguageAdmin'
      ]
    },
    {
      type: 'language-resource-delete-policy',
      roles: [
        'keycloakOrgAdmin',
        'keycloakLanguageAdmin'
      ]
    },
    // 7.8 user-resource
    {
      type: 'user-resource-create-policy',
      roles: [
        'keycloakUser'
      ]
    },
    {
      type: 'user-resource-update-policy',
      roles: [
        'keycloakUser'
      ]
    },
    {
      type: 'user-resource-view-policy',
      roles: [
        'keycloakUser'
      ]
    },
    {
      type: 'user-resource-delete-policy',
      roles: [
        'keycloakUser'
      ]
    },
  ],
  // 8. auth permission
  keycloakClientAuthPermissions: [
    // 8.1 org-resource
    {
      type: 'org-resource-create-permission',
      policies: [
        'org-resource-create-policy'
      ],
      resources: [
        'org-resource-create'
      ],
    },
    {
      type: 'org-resource-update-permission',
      policies: [
        'org-resource-update-policy'
      ],
      resources: [
        'org-resource-update'
      ],
    },
    {
      type: 'org-resource-view-permission',
      policies: [
        'org-resource-view-policy'
      ],
      resources: [
        'org-resource-view'
      ],
    },
    {
      type: 'org-resource-delete-permission',
      policies: [
        'org-resource-delete-policy'
      ],
      resources: [
        'org-resource-delete'
      ],
    },
    // 8.2 content-resource
    {
      type: 'content-resource-create-permission',
      policies: [
        'content-resource-create-policy'
      ],
      resources: [
        'content-resource-create'
      ],
    },
    {
      type: 'content-resource-update-permission',
      policies: [
        'content-resource-update-policy'
      ],
      resources: [
        'content-resource-update'
      ],
    },
    {
      type: 'content-resource-view-permission',
      policies: [
        'content-resource-view-policy'
      ],
      resources: [
        'content-resource-view'
      ],
    },
    {
      type: 'content-resource-delete-permission',
      policies: [
        'content-resource-delete-policy'
      ],
      resources: [
        'content-resource-delete'
      ],
    },
    // 8.3 publish-resource
    {
      type: 'publish-resource-create-permission',
      policies: [
        'publish-resource-create-policy'
      ],
      resources: [
        'publish-resource-create'
      ],
    },
    {
      type: 'publish-resource-update-permission',
      policies: [
        'publish-resource-update-policy'
      ],
      resources: [
        'publish-resource-update'
      ],
    },
    {
      type: 'publish-resource-view-permission',
      policies: [
        'publish-resource-view-policy'
      ],
      resources: [
        'publish-resource-view'
      ],
    },
    {
      type: 'publish-resource-delete-permission',
      policies: [
        'publish-resource-delete-policy'
      ],
      resources: [
        'publish-resource-delete'
      ],
    },
    // 8.4 channel-resource
    {
      type: 'channel-resource-create-permission',
      policies: [
        'channel-resource-create-policy'
      ],
      resources: [
        'channel-resource-create'
      ],
    },
    {
      type: 'channel-resource-update-permission',
      policies: [
        'channel-resource-update-policy'
      ],
      resources: [
        'channel-resource-update'
      ],
    },
    {
      type: 'channel-resource-view-permission',
      policies: [
        'channel-resource-view-policy'
      ],
      resources: [
        'channel-resource-view'
      ],
    },
    {
      type: 'channel-resource-delete-permission',
      policies: [
        'channel-resource-delete-policy'
      ],
      resources: [
        'channel-resource-delete'
      ],
    },
    // 8.5 user-manage-resource
    {
      type: 'user-manage-resource-create-permission',
      policies: [
        'user-manage-resource-create-policy'
      ],
      resources: [
        'user-manage-resource-create'
      ],
    },
    {
      type: 'user-manage-resource-update-permission',
      policies: [
        'user-manage-resource-update-policy'
      ],
      resources: [
        'user-manage-resource-update'
      ],
    },
    {
      type: 'user-manage-resource-view-permission',
      policies: [
        'user-manage-resource-view-policy'
      ],
      resources: [
        'user-manage-resource-view'
      ],
    },
    {
      type: 'user-manage-resource-delete-permission',
      policies: [
        'user-manage-resource-delete-policy'
      ],
      resources: [
        'user-manage-resource-delete'
      ],
    },
    // 8.6 analytics-resource
    {
      type: 'analytics-resource-create-permission',
      policies: [
        'analytics-resource-create-policy'
      ],
      resources: [
        'analytics-resource-create'
      ],
    },
    {
      type: 'analytics-resource-update-permission',
      policies: [
        'analytics-resource-update-policy'
      ],
      resources: [
        'analytics-resource-update'
      ],
    },
    {
      type: 'analytics-resource-view-permission',
      policies: [
        'analytics-resource-view-policy'
      ],
      resources: [
        'analytics-resource-view'
      ],
    },
    {
      type: 'analytics-resource-delete-permission',
      policies: [
        'analytics-resource-delete-policy'
      ],
      resources: [
        'analytics-resource-delete'
      ],
    },
    // 8.7 language-resource
    {
      type: 'language-resource-create-permission',
      policies: [
        'language-resource-create-policy'
      ],
      resources: [
        'language-resource-create'
      ],
    },
    {
      type: 'language-resource-update-permission',
      policies: [
        'language-resource-update-policy'
      ],
      resources: [
        'language-resource-update'
      ],
    },
    {
      type: 'language-resource-view-permission',
      policies: [
        'language-resource-view-policy'
      ],
      resources: [
        'language-resource-view'
      ],
    },
    {
      type: 'language-resource-delete-permission',
      policies: [
        'language-resource-delete-policy'
      ],
      resources: [
        'language-resource-delete'
      ],
    },
    // 8.8 user-resource
    {
      type: 'user-resource-create-permission',
      policies: [
        'user-resource-create-policy'
      ],
      resources: [
        'user-resource-create'
      ],
    },
    {
      type: 'user-resource-update-permission',
      policies: [
        'user-resource-update-policy'
      ],
      resources: [
        'user-resource-update'
      ],
    },
    {
      type: 'user-resource-view-permission',
      policies: [
        'user-resource-view-policy'
      ],
      resources: [
        'user-resource-view'
      ],
    },
    {
      type: 'user-resource-delete-permission',
      policies: [
        'user-resource-delete-policy'
      ],
      resources: [
        'user-resource-delete'
      ],
    },
  ],

  // =================================================
  // MySQL
  mysqlHost: 'mysql-bitnami-mysql.default.svc.cluster.local',
  mysqlUser: 'root',
  mysqlPassword: 'root',


  // =================================================
  // MongoDB
  mongoDbHost: 'mongodb-bitnami.default.svc.cluster.local',
  mongoDbUser: 'root',
  mongoDbPassword: 'root',


  // =================================================
  // LRS
  LRS_HOST: "http://35.183.78.221",

  // =================================================

  // JWT
  JWT_SECRET: "digitalxi production",

  // =================================================

  // Nodemailer
  NODE_EMAIL_SERVICE: "gmail",
  NODE_EMAIL_TYPE: "OAuth2",
  NODE_EMAIL_USER: "roy@digitalxi.com",
  NODE_EMAIL_CLIENT_ID: "515987016611-586vmem1hdaq6cr4hmni2ku3v9iuj0b3.apps.googleusercontent.com",
  NODE_EMAIL_CLIENT_SECRET: "lA5oB4rrWmuo8Jprde72g5K3",
  NODE_EMAIL_REFRESH_TOKEN: "1/h2-zRV25VnKLytrtod46BFm6cdot3MZtPnpJiIPxYFo",
  NODE_EMAIL_ACCESS_TOKEN: "ya29.GluGBtuR4rKaCnhvbnrFSZ4K5Ox75-qVXZByi-Hp75CPnFS1fbjBN6MuAJMhst2mtc2kG7qDCG1gvTQnfuuBCSwMN13ioE1qbx3CIyIFDcJLGeOH9SxYigjfPuFj",

  // =================================================

  // Twilio
  TWILIO_SID: "AC62a33f46de2d071b960b069dec6b2637",
  TWILIO_TOKEN: "ecf86d95294c3bada0b30e826fdde7f7",
  TWILIO_NUMBER: "+13658006729",

  // =================================================

  // EXPERIENCE CARDS
  EXPERIENCE_CARDS: [
    'LEFT_IMAGE_TEXT',
    'RIGHT_IMAGE_TEXT',
    'BACKGROUND_TEXT',
    'BACKGROUND_IMAGE_TEXT',
    'VIDEO',
    'IMAGE',
  ],

  EXPERIENCE_CARD: {
    LEFT_IMAGE_TEXT: ['IMAGE', 'BACKGROUND_COLOR', 'COLOR'],
    RIGHT_IMAGE_TEXT: ['IMAGE', 'BACKGROUND_COLOR', 'COLOR'],
    BACKGROUND_TEXT: ['BACKGROUND_COLOR', 'COLOR'],
    BACKGROUND_IMAGE_TEXT: ['IMAGE', 'COLOR'],
    VIDEO: ['LINK'],
    IMAGE: ['IMAGE'],
  },

  // EXPERIENCE PAGES
  EXPERIENCE_PAGES: [
    'SPLASH',
    'EDITOR',
    'BUTTON',
    'EMBED_PDF',
    'VIDEO',
    'IMAGE',
    'LINK',
    'AD_BUTTON',
    'AD_BUTTON_2',
    'H5P',
  ],

  EXPERIENCE_PAGE: {
    SPLASH: ['SplashContent', 'SplashImg', 'SplashColor', 'SplashOpacityColor', 'SplashOpacity'],
    EDITOR: ['Html'],
    BUTTON: ['BtnContent', 'ConnectedPageGUID'],
    EMBED_PDF: ['Pdf', 'PdfLabel', 'PdfFileName', 'PdfBgColor'],
    VIDEO: ['VideoUrl', 'VideoInput'],
    IMAGE: ['Img', 'ImgOpacityColor', 'ImgOpacity'],
    LINK: ['Link', 'LinkInput', 'LinkLabel', 'LinkBgColor'],
    AD_BUTTON: ['AdBtnImg', 'AdBtnImgOpacityColor', 'AdBtnImgOpacity', 'AdBtnColor', 'BtnContent', 'ConnectedPageGUID'],
    AD_BUTTON_2: ['AdBtnBgColor', 'AdBtnColor', 'BtnContent', 'ConnectedPageGUID'],
    H5P: ['H5p', 'H5pLabel', 'H5pFileName', 'H5pBgColor'],
  }

};
