const Budget = require('../models/budget');
const ReviewComment = require('../models/reviewComment');
const Organization = require('../models/organization');
const Project = require('../models/project');

// Submit budget for approval (Partner users can submit their own budgets)
exports.submitBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if budget exists
    const existingBudget = await Budget.findById(id);
    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // For partner users, check if they're submitting their own organization's budget
    if (req.user.role === 'partner_user' && req.user.organization_id) {
      if (existingBudget.organization_id !== req.user.organization_id) {
        return res.status(403).json({ error: 'You can only submit budgets for your own organization' });
      }
    }
    
    // Check if budget is in draft status
    if (existingBudget.status !== 'draft') {
      return res.status(400).json({ error: 'Budget must be in draft status to submit' });
    }
    
    const budget = await Budget.submit(id, userId);
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    res.json(budget);
  } catch (error) {
    console.error('Error submitting budget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Request revisions for budget (Approvers can request revisions)
exports.requestRevisions = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body; // Optional comments for the revision request
    const userId = req.user.id;
    
    // Check if budget exists
    const existingBudget = await Budget.findById(id);
    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Check if budget is in submitted status
    if (existingBudget.status !== 'submitted') {
      return res.status(400).json({ error: 'Budget must be in submitted status to request revisions' });
    }
    
    // Check if user has permission to request revisions (accountant, budget_holder, finance_manager)
    if (!['accountant', 'budget_holder', 'finance_manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to request revisions' });
    }
    
    const budget = await Budget.requestRevisions(id, userId);
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Create a review comment if comments were provided
    if (comments) {
      const commentData = {
        entity_type: 'budget',
        entity_id: id,
        author_id: userId,
        content: comments,
        is_resolved: false
      };
      
      await ReviewComment.create(commentData);
    }
    
    res.json(budget);
  } catch (error) {
    console.error('Error requesting revisions for budget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Approve budget (Approvers can approve budgets)
exports.approveBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body; // Optional comments for the approval
    const userId = req.user.id;
    
    // Check if budget exists
    const existingBudget = await Budget.findById(id);
    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Check if budget is in submitted status
    if (existingBudget.status !== 'submitted') {
      return res.status(400).json({ error: 'Budget must be in submitted status to approve' });
    }
    
    // Check if user has permission to approve (accountant, budget_holder, finance_manager)
    if (!['accountant', 'budget_holder', 'finance_manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to approve budgets' });
    }
    
    const budget = await Budget.approve(id, userId);
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Create a review comment if comments were provided
    if (comments) {
      const commentData = {
        entity_type: 'budget',
        entity_id: id,
        author_id: userId,
        content: comments,
        is_resolved: false
      };
      
      await ReviewComment.create(commentData);
    }
    
    res.json(budget);
  } catch (error) {
    console.error('Error approving budget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Multi-level approval workflow
// Accountant can approve budgets up to a certain amount
exports.accountantApprove = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const userId = req.user.id;
    
    // Check if budget exists
    const existingBudget = await Budget.findById(id);
    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Check if budget is in submitted status
    if (existingBudget.status !== 'submitted') {
      return res.status(400).json({ error: 'Budget must be in submitted status to approve' });
    }
    
    // Check if user is an accountant
    if (req.user.role !== 'accountant') {
      return res.status(403).json({ error: 'You do not have permission to approve budgets as an accountant' });
    }
    
    // For accountant approval, we'll just mark it as approved by accountant
    // In a real implementation, you might want to check the budget amount
    // and have additional logic for multi-level approval
    
    const budgetData = {
      status: 'approved_by_accountant',
      approved_at: new Date(),
      approved_by: userId,
      updated_by: userId
    };
    
    const budget = await Budget.update(id, budgetData);
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Create a review comment if comments were provided
    if (comments) {
      const commentData = {
        entity_type: 'budget',
        entity_id: id,
        author_id: userId,
        content: comments,
        is_resolved: false
      };
      
      await ReviewComment.create(commentData);
    }
    
    res.json(budget);
  } catch (error) {
    console.error('Error approving budget as accountant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Budget Holder can approve budgets
exports.budgetHolderApprove = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const userId = req.user.id;
    
    // Check if budget exists
    const existingBudget = await Budget.findById(id);
    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Check if budget is in approved_by_accountant status
    if (existingBudget.status !== 'approved_by_accountant') {
      return res.status(400).json({ error: 'Budget must be approved by accountant first' });
    }
    
    // Check if user is a budget holder
    if (req.user.role !== 'budget_holder') {
      return res.status(403).json({ error: 'You do not have permission to approve budgets as a budget holder' });
    }
    
    // Update budget status to approved_by_budget_holder
    const budgetData = {
      status: 'approved_by_budget_holder',
      updated_by: userId
    };
    
    const budget = await Budget.update(id, budgetData);
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Create a review comment if comments were provided
    if (comments) {
      const commentData = {
        entity_type: 'budget',
        entity_id: id,
        author_id: userId,
        content: comments,
        is_resolved: false
      };
      
      await ReviewComment.create(commentData);
    }
    
    res.json(budget);
  } catch (error) {
    console.error('Error approving budget as budget holder:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Finance Manager can give final approval
exports.financeManagerApprove = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const userId = req.user.id;
    
    // Check if budget exists
    const existingBudget = await Budget.findById(id);
    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Check if budget is in approved_by_budget_holder status
    if (existingBudget.status !== 'approved_by_budget_holder') {
      return res.status(400).json({ error: 'Budget must be approved by budget holder first' });
    }
    
    // Check if user is a finance manager
    if (req.user.role !== 'finance_manager') {
      return res.status(403).json({ error: 'You do not have permission to approve budgets as a finance manager' });
    }
    
    // Final approval - set status to approved
    const budget = await Budget.approve(id, userId);
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Create a review comment if comments were provided
    if (comments) {
      const commentData = {
        entity_type: 'budget',
        entity_id: id,
        author_id: userId,
        content: comments,
        is_resolved: false
      };
      
      await ReviewComment.create(commentData);
    }
    
    res.json(budget);
  } catch (error) {
    console.error('Error approving budget as finance manager:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};