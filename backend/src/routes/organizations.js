const express = require('express');
const { body, param } = require('express-validator');
const organizationService = require('../services/organization.service');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validator');

const router = express.Router();

/**
 * GET /api/organizations
 * Get user's organizations
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const organizations = await organizationService.getUserOrganizations(req.user.id);
    res.json({ organizations });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/organizations/:id
 * Get organization by ID
 */
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const organization = await organizationService.getById(req.params.id);
      
      if (!organization) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Organization not found',
        });
      }
      
      res.json({ organization });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/organizations
 * Create new organization
 */
router.post(
  '/',
  authenticate,
  [
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('slug').trim().isLength({ min: 2, max: 100 }).matches(/^[a-z0-9-]+$/),
  ],
  validate,
  async (req, res, next) => {
    try {
      const organization = await organizationService.create({
        ...req.body,
        userId: req.user.id,
      });
      
      res.status(201).json({ organization });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/organizations/:id
 * Update organization
 */
router.patch(
  '/:id',
  authenticate,
  authorize('owner', 'admin'),
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('logo_url').optional().isURL(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const organization = await organizationService.update(req.params.id, req.body);
      res.json({ organization });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/organizations/:id/members
 * Get organization members
 */
router.get(
  '/:id/members',
  authenticate,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const members = await organizationService.getMembers(req.params.id);
      res.json({ members });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/organizations/:id/members
 * Add member to organization
 */
router.post(
  '/:id/members',
  authenticate,
  authorize('owner', 'admin'),
  [
    param('id').isUUID(),
    body('userId').isUUID(),
    body('role').isIn(['owner', 'admin', 'member', 'viewer']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const member = await organizationService.addMember(
        req.params.id,
        req.body.userId,
        req.body.role
      );
      
      res.status(201).json({ member });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/organizations/:id/members/:userId
 * Update member role
 */
router.patch(
  '/:id/members/:userId',
  authenticate,
  authorize('owner', 'admin'),
  [
    param('id').isUUID(),
    param('userId').isUUID(),
    body('role').isIn(['owner', 'admin', 'member', 'viewer']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const member = await organizationService.updateMemberRole(
        req.params.id,
        req.params.userId,
        req.body.role
      );
      
      res.json({ member });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/organizations/:id/members/:userId
 * Remove member from organization
 */
router.delete(
  '/:id/members/:userId',
  authenticate,
  authorize('owner', 'admin'),
  [
    param('id').isUUID(),
    param('userId').isUUID(),
  ],
  validate,
  async (req, res, next) => {
    try {
      await organizationService.removeMember(req.params.id, req.params.userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
