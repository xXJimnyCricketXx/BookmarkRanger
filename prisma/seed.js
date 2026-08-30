const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const existing = await prisma.account.count();
    if (existing > 0) {
        console.log('Account already exists, skipping seed.');
        return;
    }

    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.account.create({ data: { username: 'admin', passwordHash } });
    await prisma.settings.create({ data: {} });

    const board = await prisma.board.create({ data: { name: 'Privat', order: 0 } });

    const toolsCategory = await prisma.category.create({ data: { name: 'Tools', boardId: board.id, order: 0 } });
    const docsCategory = await prisma.category.create({ data: { name: 'Docs', boardId: board.id, order: 1 } });

    const jsTag = await prisma.tag.create({ data: { name: 'javascript' } });
    const automationTag = await prisma.tag.create({ data: { name: 'automation' } });

    await prisma.bookmark.create({
        data: {
            title: 'GitHub',
            url: 'https://github.com',
            categoryId: toolsCategory.id,
            order: 0,
            isPinned: true
        }
    });

    await prisma.bookmark.create({
        data: {
            title: 'MDN Web Docs',
            url: 'https://developer.mozilla.org',
            categoryId: docsCategory.id,
            order: 0
        }
    });

    await prisma.snippet.create({
        data: {
            title: 'Recursively copy all files',
            shortDescription: 'Bash script to copy all files from src to dest',
            language: 'bash',
            code: 'cp -r ./src ./dest',
            documentation: "'-r' flag stands for '--recursive'",
            isPinned: true,
            tags: { connect: [{ id: automationTag.id }] }
        }
    });

    await prisma.snippet.create({
        data: {
            title: 'Debounce function',
            shortDescription: 'Delay execution until input settles',
            language: 'javascript',
            code: 'function debounce(fn, delay) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n}',
            tags: { connect: [{ id: jsTag.id }] }
        }
    });

    console.log('Seed complete: admin / admin123');
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
