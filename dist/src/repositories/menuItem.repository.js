"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuItemRepository = exports.MenuCategory = void 0;
const client_1 = require("@prisma/client");
var MenuCategory;
(function (MenuCategory) {
    MenuCategory["BREAKFAST"] = "BREAKFAST";
    MenuCategory["LUNCH"] = "LUNCH";
    MenuCategory["DINNER"] = "DINNER";
    MenuCategory["SNACKS"] = "SNACKS";
    MenuCategory["BEVERAGES"] = "BEVERAGES";
    MenuCategory["DESSERTS"] = "DESSERTS";
})(MenuCategory || (exports.MenuCategory = MenuCategory = {}));
class MenuItemRepository {
    static prisma;
    static initialize() {
        if (!MenuItemRepository.prisma) {
            MenuItemRepository.prisma = new client_1.PrismaClient();
        }
    }
    static async findAll(schoolId) {
        MenuItemRepository.initialize();
        return await MenuItemRepository.prisma.menuItem.findMany({
            where: schoolId ? { schoolId } : {},
            orderBy: { name: 'asc' },
        });
    }
    static async findById(id) {
        MenuItemRepository.initialize();
        return await MenuItemRepository.prisma.menuItem.findUnique({
            where: { id },
        });
    }
    static async findByNameAndSchool(name, schoolId) {
        MenuItemRepository.initialize();
        return await MenuItemRepository.prisma.menuItem.findFirst({
            where: {
                name,
                schoolId,
            },
        });
    }
    static async findBySchool(schoolId) {
        MenuItemRepository.initialize();
        return await MenuItemRepository.prisma.menuItem.findMany({
            where: { schoolId },
            orderBy: { name: 'asc' },
        });
    }
    static async findByCategory(schoolId, category) {
        MenuItemRepository.initialize();
        return await MenuItemRepository.prisma.menuItem.findMany({
            where: {
                schoolId,
                category,
            },
            orderBy: { name: 'asc' },
        });
    }
    static async create(data) {
        MenuItemRepository.initialize();
        return await MenuItemRepository.prisma.menuItem.create({
            data: data,
        });
    }
    static async update(id, data) {
        MenuItemRepository.initialize();
        return await MenuItemRepository.prisma.menuItem.update({
            where: { id },
            data,
        });
    }
    static async delete(id) {
        MenuItemRepository.initialize();
        return await MenuItemRepository.prisma.menuItem.delete({
            where: { id },
        });
    }
    static async search(options) {
        MenuItemRepository.initialize();
        const { query, filters = {}, skip = 0, take = 20, sortBy = 'name', sortOrder = 'asc', } = options;
        const where = {
            AND: [
                {
                    OR: [{ name: { contains: query } }, { description: { contains: query } }],
                },
                ...(filters.schoolId ? [{ schoolId: filters.schoolId }] : []),
                ...(filters.category ? [{ category: filters.category }] : []),
                ...(filters.available !== undefined ? [{ available: filters.available }] : []),
                ...(filters.featured !== undefined ? [{ featured: filters.featured }] : []),
                ...(filters.priceMin !== undefined || filters.priceMax !== undefined
                    ? [
                        {
                            price: {
                                ...(filters.priceMin !== undefined ? { gte: filters.priceMin } : {}),
                                ...(filters.priceMax !== undefined ? { lte: filters.priceMax } : {}),
                            },
                        },
                    ]
                    : []),
            ],
        };
        const [items, total] = await Promise.all([
            MenuItemRepository.prisma.menuItem.findMany({
                where,
                skip,
                take,
                orderBy: { [sortBy]: sortOrder },
            }),
            MenuItemRepository.prisma.menuItem.count({ where }),
        ]);
        return { items, total };
    }
    static async findMany(options) {
        MenuItemRepository.initialize();
        const { filters = {}, skip = 0, take = 20, sortBy = 'name', sortOrder = 'asc' } = options;
        const whereConditions = [];
        if (filters.schoolId) {
            whereConditions.push({ schoolId: filters.schoolId });
        }
        if (filters.category) {
            whereConditions.push({ category: filters.category });
        }
        if (filters.available !== undefined) {
            whereConditions.push({ available: filters.available });
        }
        if (filters.featured !== undefined) {
            whereConditions.push({ featured: filters.featured });
        }
        if (filters.search) {
            whereConditions.push({
                OR: [{ name: { contains: filters.search } }, { description: { contains: filters.search } }],
            });
        }
        if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
            whereConditions.push({
                price: {
                    ...(filters.priceMin !== undefined ? { gte: filters.priceMin } : {}),
                    ...(filters.priceMax !== undefined ? { lte: filters.priceMax } : {}),
                },
            });
        }
        if (filters.ids) {
            whereConditions.push({ id: { in: filters.ids } });
        }
        const where = whereConditions.length > 0 ? { AND: whereConditions } : {};
        const [items, total] = await Promise.all([
            MenuItemRepository.prisma.menuItem.findMany({
                where,
                skip,
                take,
                orderBy: { [sortBy]: sortOrder },
            }),
            MenuItemRepository.prisma.menuItem.count({ where }),
        ]);
        return { items, total };
    }
    static async batchUpdateSortOrders(updates) {
        MenuItemRepository.initialize();
        const updatePromises = updates.map(({ id, sortOrder }) => MenuItemRepository.prisma.menuItem.update({
            where: { id },
            data: { sortOrder },
        }));
        await MenuItemRepository.prisma.$transaction(updatePromises);
    }
    static async nameExists(name, schoolId) {
        MenuItemRepository.initialize();
        const existing = await MenuItemRepository.prisma.menuItem.findFirst({
            where: {
                name,
                schoolId,
            },
        });
        return !!existing;
    }
}
exports.MenuItemRepository = MenuItemRepository;
exports.default = MenuItemRepository;
//# sourceMappingURL=menuItem.repository.js.map