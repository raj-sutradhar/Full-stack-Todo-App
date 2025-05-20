const Todo = require('../models/Todo')

module.exports = {
    getTodos: async (req,res)=>{
        try{
            const sort = req.query.sort || 'createdAt';
            const order = req.query.order || 'desc';
            const filter = req.query.filter || 'all';
            const search = req.query.search || '';
            
            let query = { userId: req.user.id };
            
            // Apply filter
            if (filter === 'active') {
                query.completed = false;
            } else if (filter === 'completed') {
                query.completed = true;
            }
            
            // Apply search
            if (search) {
                query.todo = { $regex: search, $options: 'i' };
            }
            
            // Get categories for filter dropdown
            const categories = await Todo.distinct('category', { userId: req.user.id });
            
            // Get todos with sorting
            const sortOption = {};
            sortOption[sort] = order === 'asc' ? 1 : -1;
            
            const todoItems = await Todo.find(query).sort(sortOption);
            const itemsLeft = await Todo.countDocuments({userId: req.user.id, completed: false});
            const totalItems = await Todo.countDocuments({userId: req.user.id});
            const completedItems = totalItems - itemsLeft;
            
            // Get stats for each priority
            const highPriorityCount = await Todo.countDocuments({userId: req.user.id, priority: 'high', completed: false});
            const mediumPriorityCount = await Todo.countDocuments({userId: req.user.id, priority: 'medium', completed: false});
            const lowPriorityCount = await Todo.countDocuments({userId: req.user.id, priority: 'low', completed: false});
            
            // Get stats for each category
            const categoryStats = await Promise.all(
                categories.map(async (category) => {
                    const count = await Todo.countDocuments({userId: req.user.id, category});
                    return { category, count };
                })
            );
            
            res.render('todos.ejs', {
                todos: todoItems, 
                left: itemsLeft,
                completed: completedItems,
                total: totalItems,
                user: req.user,
                categories,
                categoryStats,
                priorityStats: {
                    high: highPriorityCount,
                    medium: mediumPriorityCount,
                    low: lowPriorityCount
                },
                currentFilter: filter,
                currentSort: sort,
                currentOrder: order,
                searchQuery: search
            });
        } catch(err) {
            console.log(err);
            res.status(500).send('Server error');
        }
    },
    
    createTodo: async (req, res)=>{
        try{
            const { todoItem, dueDate, priority, category, notes } = req.body;
            
            // Get highest position for proper ordering
            const highestPositionTodo = await Todo.findOne({ userId: req.user.id }).sort({ position: -1 });
            const position = highestPositionTodo ? highestPositionTodo.position + 1 : 0;
            
            await Todo.create({
                todo: todoItem, 
                completed: false, 
                userId: req.user.id,
                dueDate: dueDate || null,
                priority: priority || 'medium',
                category: category || 'general',
                notes: notes || '',
                position
            });
            
            console.log('Todo has been added!');
            res.redirect('/todos');
        } catch(err) {
            console.log(err);
            res.status(500).send('Server error');
        }
    },
    
    markComplete: async (req, res)=>{
        try{
            await Todo.findOneAndUpdate(
                {_id: req.body.todoIdFromJSFile},
                { completed: true }
            );
            console.log('Marked Complete');
            res.json({ success: true, message: 'Marked Complete' });
        } catch(err) {
            console.log(err);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    },
    
    markIncomplete: async (req, res)=>{
        try{
            await Todo.findOneAndUpdate(
                {_id: req.body.todoIdFromJSFile},
                { completed: false }
            );
            console.log('Marked Incomplete');
            res.json({ success: true, message: 'Marked Incomplete' });
        } catch(err) {
            console.log(err);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    },
    
    deleteTodo: async (req, res)=>{
        try{
            await Todo.findOneAndDelete({_id: req.body.todoIdFromJSFile});
            console.log('Deleted Todo');
            res.json({ success: true, message: 'Todo deleted successfully' });
        } catch(err) {
            console.log(err);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    },
    
    updateTodo: async (req, res) => {
        try {
            const { id, todo, dueDate, priority, category, notes } = req.body;
            
            const updatedTodo = await Todo.findOneAndUpdate(
                { _id: id, userId: req.user.id },
                { 
                    todo, 
                    dueDate: dueDate || null,
                    priority: priority || 'medium',
                    category: category || 'general',
                    notes: notes || ''
                },
                { new: true }
            );
            
            if (!updatedTodo) {
                return res.status(404).json({ success: false, error: 'Todo not found' });
            }
            
            res.json({ success: true, todo: updatedTodo });
        } catch (err) {
            console.log(err);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    },
    
    updatePosition: async (req, res) => {
        try {
            const { positions } = req.body;
            
            // Update positions in batch
            const updatePromises = positions.map(({ id, position }) => {
                return Todo.updateOne(
                    { _id: id, userId: req.user.id },
                    { position }
                );
            });
            
            await Promise.all(updatePromises);
            
            res.json({ success: true, message: 'Positions updated successfully' });
        } catch (err) {
            console.log(err);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    },
    
    getTodoById: async (req, res) => {
        try {
            const todo = await Todo.findOne({ _id: req.params.id, userId: req.user.id });
            
            if (!todo) {
                return res.status(404).json({ success: false, error: 'Todo not found' });
            }
            
            res.json({ success: true, todo });
        } catch (err) {
            console.log(err);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    }
}