const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { receiverId, text, fileUrl, fileType } = req.body;
    const senderId = req.user._id;

    if (!receiverId || (!text && !fileUrl)) {
      return res.status(400).json({ success: false, message: 'Receiver ID and either text or file are required' });
    }

    // Check if conversation exists
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = await Message.create({
      conversationId: conversation._id,
      sender: senderId,
      text: text || '',
      fileUrl: fileUrl || '',
      fileType: fileType || '',
    });

    // Update conversation with latest message
    conversation.latestMessage = newMessage._id;
    await conversation.save();

    // Emit via socket
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const receiverSocket = onlineUsers.get(receiverId.toString());
    
    if (receiverSocket) {
      io.to(receiverSocket).emit('newMessage', newMessage);
    }

    res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all conversations for a user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'username profilePic fullName')
      .populate('latestMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found or access denied' });
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }); // Oldest first

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  sendMessage,
  getConversations,
  getMessages,
};
