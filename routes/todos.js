const express = require('express')
const router = express.Router()
const todosController = require('../controllers/todos') 
const { ensureAuth } = require('../middleware/auth')

// Main todos page
router.get('/', ensureAuth, todosController.getTodos)

// Create new todo
router.post('/createTodo', ensureAuth, todosController.createTodo)

// Mark todo as complete/incomplete
router.put('/markComplete', ensureAuth, todosController.markComplete)
router.put('/markIncomplete', ensureAuth, todosController.markIncomplete)

// Delete todo
router.delete('/deleteTodo', ensureAuth, todosController.deleteTodo)

// Get todo by ID
router.get('/todo/:id', ensureAuth, todosController.getTodoById)

// Update todo
router.put('/updateTodo', ensureAuth, todosController.updateTodo)

// Update positions (for drag and drop)
router.put('/updatePosition', ensureAuth, todosController.updatePosition)

module.exports = router