import type { Express } from "express";
import { z } from "zod";
import { storage } from "../../storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Validation schemas
const companyOnboardingSchema = z.object({
  // Company data
  companyName: z.string().min(1, "Company name is required"),
  companyDomain: z.string().optional(),
  industry: z.string().min(1, "Industry is required"),
  teamSize: z.string().min(1, "Team size is required"),
  currencyPreference: z.enum(['USD', 'BTC']).default('USD'),
  
  // Admin user data
  adminName: z.string().min(1, "Admin name is required"),
  adminEmail: z.string().email("Invalid email address"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
  
  // Branding data
  primaryColor: z.string().default('#f97316'),
  companyDescription: z.string().optional(),
  location: z.string().optional(),
  
  // Bitcoin configuration
  btcWalletAddress: z.string().optional(),
  lightningEnabled: z.boolean().default(false),
  
  // Team setup
  employees: z.array(z.object({
    name: z.string().min(1, "Employee name is required"),
    email: z.string().email("Invalid email address"),
    role: z.enum(['employee', 'manager', 'admin']).default('employee')
  })).optional().default([])
});

// Hash password function
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export default function onboardingRoutes(app: Express) {
  // Create company and admin user
  app.post("/api/onboarding/complete", async (req, res) => {
  try {
    const validatedData = companyOnboardingSchema.parse(req.body);
    
    // Check if company already exists (we'll need to implement this method)
    // For now, we'll skip this check
    const companySlug = validatedData.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // TODO: Implement company slug uniqueness check
    
    // Check if admin email already exists
    const existingUser = await storage.getUserByEmail(validatedData.adminEmail);
    if (existingUser) {
      return res.status(400).json({
        message: "A user with this email already exists"
      });
    }
    
    // Create company
    const company = await storage.createCompany({
      name: validatedData.companyName,
      slug: companySlug,
      domain: validatedData.companyDomain,
      primaryColor: validatedData.primaryColor,
      isActive: true
    });
    
    // Create admin user
    const hashedPassword = await hashPassword(validatedData.adminPassword);
    const adminUser = await storage.createUser({
      username: validatedData.adminEmail.split('@')[0], // Use email prefix as username
      email: validatedData.adminEmail,
      password: hashedPassword,
      firstName: validatedData.adminName.split(' ')[0] || validatedData.adminName,
      lastName: validatedData.adminName.split(' ').slice(1).join(' ') || '',
      role: 'admin',
      companyId: company.id,
      isActive: true,
      monthlySalary: null
    });
    
    // Create employees if provided
    const createdEmployees = [];
    for (const employeeData of validatedData.employees) {
      const employeePassword = await hashPassword('temp-password-' + Math.random().toString(36).substring(7));
      const employee = await storage.createUser({
        username: employeeData.email.split('@')[0],
        email: employeeData.email,
        password: employeePassword,
        firstName: employeeData.name.split(' ')[0] || employeeData.name,
        lastName: employeeData.name.split(' ').slice(1).join(' ') || '',
        role: employeeData.role === 'manager' ? 'employee' : employeeData.role, // Map manager to employee for now
        companyId: company.id,
        isActive: true,
        monthlySalary: null
      });
      createdEmployees.push(employee);
    }
    
    res.status(201).json({
      message: "Company setup completed successfully",
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        primaryColor: company.primaryColor
      },
      admin: {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: adminUser.role
      },
      employees: createdEmployees.map(emp => ({
        id: emp.id,
        username: emp.username,
        email: emp.email,
        firstName: emp.firstName,
        lastName: emp.lastName,
        role: emp.role
      }))
    });
    
  } catch (error) {
    console.error('Onboarding completion error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors
      });
    }
    
    res.status(500).json({
      message: "Failed to complete company setup",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
  });

  // Upload company logo
  app.post("/api/onboarding/upload-logo", async (req, res) => {
  try {
    // TODO: Implement file upload logic
    // This would typically use multer or similar middleware
    // For now, return a placeholder response
    
    res.status(200).json({
      message: "Logo upload endpoint ready",
      note: "File upload implementation needed"
    });
    
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({
      message: "Failed to upload logo",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
  });

  // Upload admin photo
  app.post("/api/onboarding/upload-photo", async (req, res) => {
  try {
    // TODO: Implement file upload logic
    // This would typically use multer or similar middleware
    // For now, return a placeholder response
    
    res.status(200).json({
      message: "Photo upload endpoint ready",
      note: "File upload implementation needed"
    });
    
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({
      message: "Failed to upload photo",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
  });

  // Validate company domain
  app.post("/api/onboarding/validate-domain", async (req, res) => {
  try {
    const { domain } = req.body;
    
    if (!domain) {
      return res.status(400).json({
        message: "Domain is required"
      });
    }
    
    // TODO: Implement domain uniqueness check
    // For now, we'll assume it's available
    const existingCompany = null;
    
    res.status(200).json({
      available: !existingCompany,
      message: existingCompany ? "Domain is already taken" : "Domain is available"
    });
    
  } catch (error) {
    console.error('Domain validation error:', error);
    res.status(500).json({
      message: "Failed to validate domain",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
  });

  // Get onboarding progress (for resuming)
  app.get("/api/onboarding/progress/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const company = await storage.getCompany(parseInt(companyId));
    if (!company) {
      return res.status(404).json({
        message: "Company not found"
      });
    }
    
    // Get company admin
    const adminUsers = await storage.getEmployees(); // This would need to be filtered by company
    const admin = adminUsers.find(user => user.role === 'admin' && user.companyId === parseInt(companyId));
    
    res.status(200).json({
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        domain: company.domain,
        primaryColor: company.primaryColor
      },
      admin: admin ? {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName
      } : null,
      completed: !!admin
    });
    
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      message: "Failed to get onboarding progress",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
  });

}