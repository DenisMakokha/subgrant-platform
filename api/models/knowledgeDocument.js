const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const KnowledgeDocument = sequelize.define('KnowledgeDocument', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('policy', 'procedure', 'guideline', 'template', 'training', 'reference'),
      allowNull: false,
      defaultValue: 'reference'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    version: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '1.0'
    },
    status: {
      type: DataTypes.ENUM('draft', 'review', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastReviewed: {
      type: DataTypes.DATE,
      allowNull: true
    },
    nextReview: {
      type: DataTypes.DATE,
      allowNull: true
    },
    downloadCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    viewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: true
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: false
    },
    updatedBy: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'knowledge_documents',
    timestamps: true,
    indexes: [
      {
        fields: ['type']
      },
      {
        fields: ['category']
      },
      {
        fields: ['status']
      },
      {
        fields: ['author']
      },
      {
        fields: ['tags']
      },
      {
        fields: ['title']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  KnowledgeDocument.associate = (models) => {
    // Define associations if needed
    KnowledgeDocument.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });

    KnowledgeDocument.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'updater'
    });
  };

  return KnowledgeDocument;
};
