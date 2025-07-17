import type { Express } from "express";
import { requireAuth, requireAdmin } from "../../auth";
import { storage } from "../../storage";
import { z } from "zod";

// Onboarding flow schema
const createOnboardingFlowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  department: z.string().min(1, "Department is required"),
  tasks: z.array(z.object({
    title: z.string().min(1, "Task title is required"),
    type: z.enum(['form', 'document', 'video', 'quiz', 'meeting', 'system']),
    description: z.string().min(1, "Task description is required"),
    required: z.boolean().default(true),
    estimatedTime: z.number().optional(),
  })).min(1, "At least one task is required"),
});

// Task progress schema
const updateTaskProgressSchema = z.object({
  status: z.enum(['in_progress', 'completed']),
  notes: z.string().optional(),
});

export default function onboardingRoutes(app: Express) {
  // Get all onboarding flows
  app.get('/api/onboarding', requireAuth, async (req, res) => {
    try {
      const flows = await storage.getOnboardingFlows();
      res.json(flows);
    } catch (error) {
      console.error('Failed to fetch onboarding flows:', error);
      res.status(500).json({ message: 'Failed to fetch onboarding flows' });
    }
  });

  // Get single onboarding flow with tasks
  app.get('/api/onboarding/:id', requireAuth, async (req, res) => {
    try {
      const flowId = parseInt(req.params.id);
      const flow = await storage.getOnboardingFlow(flowId);
      
      if (!flow) {
        return res.status(404).json({ message: 'Onboarding flow not found' });
      }
      
      const tasks = await storage.getOnboardingTasks(flowId);
      res.json({ ...flow, tasks });
    } catch (error) {
      console.error('Failed to fetch onboarding flow:', error);
      res.status(500).json({ message: 'Failed to fetch onboarding flow' });
    }
  });

  // Create new onboarding flow
  app.post('/api/onboarding', requireAuth, async (req, res) => {
    try {
      const validatedData = createOnboardingFlowSchema.parse(req.body);
      
      const flow = await storage.createOnboardingFlow({
        name: validatedData.name,
        description: validatedData.description,
        department: validatedData.department,
        createdBy: req.user!.id,
      });
      
      // Create tasks for the flow
      const tasks = [];
      for (let i = 0; i < validatedData.tasks.length; i++) {
        const taskData = validatedData.tasks[i];
        const task = await storage.createOnboardingTask({
          flowId: flow.id,
          title: taskData.title,
          type: taskData.type,
          description: taskData.description,
          required: taskData.required,
          order: i + 1,
          estimatedTime: taskData.estimatedTime,
        });
        tasks.push(task);
      }
      
      res.status(201).json({ ...flow, tasks });
    } catch (error) {
      console.error('Failed to create onboarding flow:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create onboarding flow' });
    }
  });

  // Update onboarding flow
  app.put('/api/onboarding/:id', requireAuth, async (req, res) => {
    try {
      const flowId = parseInt(req.params.id);
      const updates = createOnboardingFlowSchema.partial().parse(req.body);
      
      const flow = await storage.updateOnboardingFlow(flowId, updates);
      
      if (!flow) {
        return res.status(404).json({ message: 'Onboarding flow not found' });
      }
      
      res.json(flow);
    } catch (error) {
      console.error('Failed to update onboarding flow:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update onboarding flow' });
    }
  });

  // Delete onboarding flow
  app.delete('/api/onboarding/:id', requireAuth, async (req, res) => {
    try {
      const flowId = parseInt(req.params.id);
      await storage.deleteOnboardingFlow(flowId);
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete onboarding flow:', error);
      res.status(500).json({ message: 'Failed to delete onboarding flow' });
    }
  });

  // Get onboarding progress
  app.get('/api/onboarding/progress', requireAuth, async (req, res) => {
    try {
      const employeeId = req.user?.role === 'admin' ? undefined : req.user?.id;
      const progress = await storage.getOnboardingProgress(employeeId);
      res.json(progress);
    } catch (error) {
      console.error('Failed to fetch onboarding progress:', error);
      res.status(500).json({ message: 'Failed to fetch onboarding progress' });
    }
  });

  // Get single onboarding progress with task details
  app.get('/api/onboarding/progress/:id', requireAuth, async (req, res) => {
    try {
      const progressId = parseInt(req.params.id);
      const progress = await storage.getOnboardingProgressById(progressId);
      
      if (!progress) {
        return res.status(404).json({ message: 'Onboarding progress not found' });
      }
      
      const taskProgress = await storage.getOnboardingTaskProgress(progressId);
      const flow = await storage.getOnboardingFlow(progress.flowId);
      const tasks = await storage.getOnboardingTasks(progress.flowId);
      
      // Combine tasks with their progress
      const tasksWithProgress = tasks.map(task => {
        const taskProgressItem = taskProgress.find(tp => tp.taskId === task.id);
        return {
          ...task,
          status: taskProgressItem?.status || 'pending',
          completedAt: taskProgressItem?.completedAt,
          notes: taskProgressItem?.notes,
        };
      });
      
      res.json({
        ...progress,
        flow,
        tasks: tasksWithProgress,
      });
    } catch (error) {
      console.error('Failed to fetch onboarding progress:', error);
      res.status(500).json({ message: 'Failed to fetch onboarding progress' });
    }
  });

  // Start onboarding for an employee
  app.post('/api/onboarding/progress/start', requireAuth, async (req, res) => {
    try {
      const { flowId, employeeId } = req.body;
      
      if (!flowId || !employeeId) {
        return res.status(400).json({ message: 'flowId and employeeId are required' });
      }
      
      const progress = await storage.startOnboarding(flowId, employeeId);
      res.status(201).json(progress);
    } catch (error) {
      console.error('Failed to start onboarding:', error);
      res.status(500).json({ message: 'Failed to start onboarding' });
    }
  });

  // Update task completion
  app.put('/api/onboarding/progress/:progressId/tasks', requireAuth, async (req, res) => {
    try {
      const progressId = parseInt(req.params.progressId);
      const { taskId, status, notes } = updateTaskProgressSchema.parse(req.body);
      
      const taskProgress = await storage.updateTaskCompletion(progressId, taskId, status, notes);
      res.json(taskProgress);
    } catch (error) {
      console.error('Failed to update task progress:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update task progress' });
    }
  });
} 