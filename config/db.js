const { createClient } = require('./database');

const prisma = createClient();

module.exports = prisma;
