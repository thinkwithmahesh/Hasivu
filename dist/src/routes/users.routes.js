"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.get('/', (req, res) => {
    res.json({ data: [], message: 'Users list endpoint' });
});
router.get('/:id', (req, res) => {
    res.json({ data: null, message: 'User details endpoint' });
});
router.post('/', (req, res) => {
    res.status(201).json({ data: null, message: 'User created' });
});
router.put('/:id', (req, res) => {
    res.json({ data: null, message: 'User updated' });
});
router.delete('/:id', (req, res) => {
    res.json({ message: 'User deleted' });
});
router.post('/:id/link-parent', (req, res) => {
    res.json({ data: null, message: 'Parent linked' });
});
router.get('/search', (req, res) => {
    res.json({ data: [], message: 'User search endpoint' });
});
exports.default = router;
//# sourceMappingURL=users.routes.js.map