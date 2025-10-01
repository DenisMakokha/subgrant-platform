const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TrainingModule = sequelize.define('TrainingModule', {
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
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('course', 'workshop', 'webinar', 'documentation', 'video', 'quiz'),
      allowNull: false,
      defaultValue: 'course'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    difficulty: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      allowNull: false,
      defaultValue: 'beginner'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    content: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    prerequisites: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    learningObjectives: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    enrollmentCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    completionRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
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
    tableName: 'training_modules',
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
        fields: ['difficulty']
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

  TrainingModule.associate = (models) => {
    // Define associations if needed
    TrainingModule.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });

    TrainingModule.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'updater'
    });

    // Association with enrollments if we create that model
    TrainingModule.hasMany(models.TrainingEnrollment, {
      foreignKey: 'moduleId',
      as: 'enrollments'
    });
  };

  return TrainingModule;
};
