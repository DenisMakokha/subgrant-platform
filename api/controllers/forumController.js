const ForumCategory = require('../models/forumCategory');
const ForumTag = require('../models/forumTag');
const ForumTopic = require('../models/forumTopic');
const ForumPost = require('../models/forumPost');
const ForumAttachment = require('../models/forumAttachment');

class ForumController {
  // Categories
  static async getCategories(req, res) {
    try {
      const { visibility, parent_id } = req.query;
      const filters = {};
      
      if (visibility) filters.visibility = visibility;
      if (parent_id !== undefined) filters.parent_id = parent_id === 'null' ? null : parseInt(parent_id);

      const categories = await ForumCategory.findAll(filters);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createCategory(req, res) {
    try {
      const categoryData = {
        ...req.body,
        created_by: req.user.id
      };
      
      const category = await ForumCategory.create(categoryData);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getCategoryById(req, res) {
    try {
      const category = await ForumCategory.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateCategory(req, res) {
    try {
      const category = await ForumCategory.update(req.params.id, req.body);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteCategory(req, res) {
    try {
      const deleted = await ForumCategory.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getCategoryHierarchy(req, res) {
    try {
      const hierarchy = await ForumCategory.getHierarchy();
      res.json(hierarchy);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Tags
  static async getTags(req, res) {
    try {
      const { search, limit } = req.query;
      const filters = {};
      
      if (search) filters.search = search;
      if (limit) filters.limit = parseInt(limit);

      const tags = await ForumTag.findAll(filters);
      res.json(tags);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createTag(req, res) {
    try {
      const tagData = {
        ...req.body,
        created_by: req.user.id
      };
      
      const tag = await ForumTag.create(tagData);
      res.status(201).json(tag);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getTagById(req, res) {
    try {
      const tag = await ForumTag.findById(req.params.id);
      if (!tag) {
        return res.status(404).json({ error: 'Tag not found' });
      }
      res.json(tag);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateTag(req, res) {
    try {
      const tag = await ForumTag.update(req.params.id, req.body);
      if (!tag) {
        return res.status(404).json({ error: 'Tag not found' });
      }
      res.json(tag);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteTag(req, res) {
    try {
      const deleted = await ForumTag.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Tag not found' });
      }
      res.json({ message: 'Tag deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getPopularTags(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const tags = await ForumTag.getPopularTags(limit);
      res.json(tags);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async searchTags(req, res) {
    try {
      const { q, limit } = req.query;
      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }
      
      const tags = await ForumTag.searchTags(q, parseInt(limit) || 10);
      res.json(tags);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Topics
  static async getTopics(req, res) {
    try {
      const filters = { ...req.query };
      const topics = await ForumTopic.findAll(filters);
      res.json(topics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createTopic(req, res) {
    try {
      const topicData = {
        ...req.body,
        author_id: req.user.id
      };
      
      const topic = await ForumTopic.create(topicData);
      res.status(201).json(topic);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getTopicById(req, res) {
    try {
      const topic = await ForumTopic.findById(req.params.id);
      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
      }

      // Increment view count
      await ForumTopic.incrementViews(req.params.id);
      topic.views += 1;

      res.json(topic);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateTopic(req, res) {
    try {
      const topic = await ForumTopic.update(req.params.id, req.body);
      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
      }
      res.json(topic);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteTopic(req, res) {
    try {
      const deleted = await ForumTopic.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Topic not found' });
      }
      res.json({ message: 'Topic deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async lockTopic(req, res) {
    try {
      const topic = await ForumTopic.update(req.params.id, { is_locked: true });
      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
      }
      res.json(topic);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async unlockTopic(req, res) {
    try {
      const topic = await ForumTopic.update(req.params.id, { is_locked: false });
      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
      }
      res.json(topic);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async pinTopic(req, res) {
    try {
      const topic = await ForumTopic.update(req.params.id, { is_pinned: true });
      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
      }
      res.json(topic);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async unpinTopic(req, res) {
    try {
      const topic = await ForumTopic.update(req.params.id, { is_pinned: false });
      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
      }
      res.json(topic);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateTopicTags(req, res) {
    try {
      const { tags } = req.body;
      await ForumTopic.updateTags(req.params.id, tags);
      res.json({ message: 'Topic tags updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Posts
  static async getTopicPosts(req, res) {
    try {
      const filters = { ...req.query };
      const posts = await ForumPost.findByTopicId(req.params.id, filters);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createPost(req, res) {
    try {
      const postData = {
        ...req.body,
        topic_id: req.params.id,
        author_id: req.user.id
      };
      
      const post = await ForumPost.create(postData);
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getPostById(req, res) {
    try {
      const post = await ForumPost.findById(req.params.postId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updatePost(req, res) {
    try {
      const post = await ForumPost.update(req.params.postId, req.body);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deletePost(req, res) {
    try {
      const deleted = await ForumPost.delete(req.params.postId);
      if (!deleted) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async markPostAsAnswer(req, res) {
    try {
      const post = await ForumPost.markAsAnswer(req.params.postId, req.params.id);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async unmarkPostAsAnswer(req, res) {
    try {
      const post = await ForumPost.unmarkAsAnswer(req.params.postId, req.params.id);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getPostReplies(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const replies = await ForumPost.getReplies(req.params.postId, limit);
      res.json(replies);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Attachments
  static async getTopicAttachments(req, res) {
    try {
      const attachments = await ForumAttachment.findByTopicId(req.params.id);
      res.json(attachments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getPostAttachments(req, res) {
    try {
      const attachments = await ForumAttachment.findByPostId(req.params.postId);
      res.json(attachments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAttachmentById(req, res) {
    try {
      const attachment = await ForumAttachment.findById(req.params.attachmentId);
      if (!attachment) {
        return res.status(404).json({ error: 'Attachment not found' });
      }
      res.json(attachment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async downloadAttachment(req, res) {
    try {
      const attachment = await ForumAttachment.findById(req.params.attachmentId);
      if (!attachment) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      if (attachment.virus_status === 'infected') {
        return res.status(403).json({ error: 'File is infected and cannot be downloaded' });
      }

      // Increment download count
      await ForumAttachment.incrementDownloadCount(req.params.attachmentId);

      // In a real implementation, you would generate a signed URL for the file
      // For now, return the file info
      res.json({
        message: 'Download initiated',
        filename: attachment.original_filename,
        size: attachment.size_bytes,
        mime_type: attachment.mime_type
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteAttachment(req, res) {
    try {
      const deleted = await ForumAttachment.delete(req.params.attachmentId);
      if (!deleted) {
        return res.status(404).json({ error: 'Attachment not found' });
      }
      res.json({ message: 'Attachment deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Search
  static async searchForum(req, res) {
    try {
      const { q, category_id, tag_id, type, sort, page, limit } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const filters = {
        search: q,
        category_id,
        tag_id,
        type,
        sort: sort || 'relevance',
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      };

      const topics = await ForumTopic.findAll(filters);
      res.json(topics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Statistics
  static async getForumStats(req, res) {
    try {
      // This would typically involve multiple queries to get comprehensive stats
      // For now, return basic structure
      const stats = {
        total_categories: 0,
        total_topics: 0,
        total_posts: 0,
        total_users: 0,
        recent_activity: []
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ForumController;
