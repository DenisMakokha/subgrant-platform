const ReviewComment = require('../models/reviewComment');

// Create a new review comment
exports.createComment = async (req, res) => {
  try {
    const { entity_type, entity_id, parent_id, content } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!entity_type || !entity_id || !content) {
      return res.status(400).json({ 
        error: 'Entity type, entity ID, and content are required' 
      });
    }

    const commentData = {
      entity_type,
      entity_id,
      parent_id: parent_id || null,
      author_id: userId,
      content,
      is_resolved: false
    };

    const comment = await ReviewComment.create(commentData);
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating review comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all review comments
exports.getAllComments = async (req, res) => {
  try {
    const comments = await ReviewComment.findAll();
    res.json(comments);
  } catch (error) {
    console.error('Error fetching review comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get review comment by ID
exports.getCommentById = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await ReviewComment.findById(id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Review comment not found' });
    }
    
    res.json(comment);
  } catch (error) {
    console.error('Error fetching review comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get review comments by entity type and ID
exports.getCommentsByEntity = async (req, res) => {
  try {
    const { entity_type, entity_id } = req.params;
    const comments = await ReviewComment.findByEntity(entity_type, entity_id);
    res.json(comments);
  } catch (error) {
    console.error('Error fetching review comments by entity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get review comments by author ID
exports.getCommentsByAuthorId = async (req, res) => {
  try {
    const { author_id } = req.params;
    const comments = await ReviewComment.findByAuthorId(author_id);
    res.json(comments);
  } catch (error) {
    console.error('Error fetching review comments by author:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update review comment
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Check if comment exists
    const existingComment = await ReviewComment.findById(id);
    if (!existingComment) {
      return res.status(404).json({ error: 'Review comment not found' });
    }

    // Check if user is the author of the comment
    if (existingComment.author_id !== userId) {
      return res.status(403).json({ error: 'You can only update your own comments' });
    }

    const commentData = {
      content: content || existingComment.content
    };

    const comment = await ReviewComment.update(id, commentData);
    if (!comment) {
      return res.status(404).json({ error: 'Review comment not found' });
    }
    
    res.json(comment);
  } catch (error) {
    console.error('Error updating review comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete review comment
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if comment exists
    const existingComment = await ReviewComment.findById(id);
    if (!existingComment) {
      return res.status(404).json({ error: 'Review comment not found' });
    }

    // Check if user is the author of the comment or an admin
    if (existingComment.author_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }
    
    const comment = await ReviewComment.delete(id);
    if (!comment) {
      return res.status(404).json({ error: 'Review comment not found' });
    }
    
    res.json({ message: 'Review comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting review comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Resolve review comment
exports.resolveComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if comment exists
    const existingComment = await ReviewComment.findById(id);
    if (!existingComment) {
      return res.status(404).json({ error: 'Review comment not found' });
    }

    const comment = await ReviewComment.resolve(id, userId);
    if (!comment) {
      return res.status(404).json({ error: 'Review comment not found' });
    }
    
    res.json(comment);
  } catch (error) {
    console.error('Error resolving review comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};