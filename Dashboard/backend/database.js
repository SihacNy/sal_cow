const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Default to SQLite (zero-install) but allow MySQL via .env
const sequelize = process.env.DB_TYPE === 'mysql'
  ? (process.env.DB_URL 
      ? new Sequelize(process.env.DB_URL, { 
          logging: false,
          dialectOptions: {
            connectTimeout: 60000
          }
        })
      : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT) || 3306,
          dialect: 'mysql',
          logging: false,
          dialectOptions: {
            connectTimeout: 60000
          }
        })
    )
  : new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, 'database.sqlite'),
      logging: false
    });

// Define Models
const Cow = sequelize.define('Cow', {
  cowId: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  breed: { type: DataTypes.STRING, allowNull: false },
  gender: { type: DataTypes.ENUM('Male', 'Female'), allowNull: false },
  birthDate: { type: DataTypes.DATE, allowNull: false },
  image: { type: DataTypes.TEXT }
});

const WeightRecord = sequelize.define('WeightRecord', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  weight: { type: DataTypes.FLOAT, allowNull: false },
  deviceId: { type: DataTypes.STRING },
  stable: { type: DataTypes.BOOLEAN, defaultValue: true },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  cowId: { type: DataTypes.STRING } // Explicit foreign key for clarity
});

const Device = sequelize.define('Device', {
  deviceId: { type: DataTypes.STRING, primaryKey: true },
  status: { type: DataTypes.ENUM('online', 'offline'), defaultValue: 'offline' },
  lastSeen: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  name: { type: DataTypes.STRING }
});

const WeightStandard = sequelize.define('WeightStandard', {
  breed: { type: DataTypes.STRING, defaultValue: 'Any' },
  gender: { type: DataTypes.ENUM('Male', 'Female', 'Any'), defaultValue: 'Any' },
  ageMinMonths: { type: DataTypes.INTEGER, allowNull: false },
  ageMaxMonths: { type: DataTypes.INTEGER, allowNull: false },
  minHealthyWeight: { type: DataTypes.FLOAT, allowNull: false },
  maxHealthyWeight: { type: DataTypes.FLOAT, allowNull: false },
  description: { type: DataTypes.STRING }
});

// Relationships
Cow.hasMany(WeightRecord, { foreignKey: 'cowId' });
WeightRecord.belongsTo(Cow, { foreignKey: 'cowId' });

// Sync Database
const initDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQL Database Connected Successfully.');
    await sequelize.sync({ alter: true });
    console.log('📊 SQL Tables Synchronized.');
  } catch (error) {
    console.error('❌ SQL Connection Error:', error);
  }
};

module.exports = { sequelize, Cow, WeightRecord, Device, WeightStandard, initDB };
