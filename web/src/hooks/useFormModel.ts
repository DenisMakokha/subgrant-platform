import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

// Standard API envelope and error types
type ApiEnvelope<T> = { 
  data: T; 
  meta?: { etag?: number; version?: number; [key: string]: unknown } 
};

type FieldErrors = Record<string, string[]>;

type FormStatus = "idle" | "loading" | "saving" | "saved" | "error" | "conflict";

type FormModelOptions<T> = {
  schema: z.ZodType<T>;
  load: (id: string) => Promise<ApiEnvelope<T>>;
  save: (id: string | null, payload: ApiEnvelope<T>) => Promise<ApiEnvelope<T>>;
  defaults: () => T;
  autosaveMs?: number;
  onSaveSuccess?: (data: T) => void;
  onSaveError?: (error: any) => void;
};

export function useFormModel<T>(opts: FormModelOptions<T>) {
  const { schema, load, save, defaults, autosaveMs = 0, onSaveSuccess, onSaveError } = opts;

  const [id, setId] = useState<string | null>(null);
  const [value, setValue] = useState<T>(defaults());
  const [etag, setEtag] = useState<number>(0);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const lastSaved = useRef<T>(value);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Calculate if form has unsaved changes
  const dirty = useMemo(() => {
    return JSON.stringify(value) !== JSON.stringify(lastSaved.current);
  }, [value]);

  // Validate current form data
  const validate = useCallback((data: T) => {
    const parsed = schema.safeParse(data);
    if (parsed.success) {
      setErrors({});
      return parsed.data;
    }
    
    // Convert Zod errors to field errors
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const formattedErrors: FieldErrors = {};
    Object.entries(fieldErrors).forEach(([key, messages]) => {
      formattedErrors[key] = Array.isArray(messages) ? messages : [];
    });
    setErrors(formattedErrors);
    return null;
  }, [schema]);

  // Load data from server
  const hydrate = useCallback(async (recordId: string) => {
    try {
      setStatus("loading");
      setErrors({});
      
      const response = await load(recordId);
      
      setId(recordId);
      setValue(response.data);
      setEtag(response.meta?.etag || 0);
      lastSaved.current = response.data;
      setStatus("idle");
      
      console.log('📥 Form hydrated:', { id: recordId, etag: response.meta?.etag });
      
    } catch (error) {
      console.error('❌ Form hydration failed:', error);
      setStatus("error");
      setErrors({ form: ['Failed to load data'] });
    }
  }, [load]);

  // Save data to server
  const commit = useCallback(async () => {
    if (status === "saving") return; // Prevent double saves
    
    const validatedData = validate(value);
    if (!validatedData) {
      setStatus("error");
      return false;
    }

    try {
      setStatus("saving");
      setErrors({});
      
      console.log('💾 Committing form data:', { id, etag, dirty });
      
      const response = await save(id, {
        data: validatedData,
        meta: { etag }
      });
      
      // Update local state with server response
      setValue(response.data);
      setEtag(response.meta?.etag || etag);
      lastSaved.current = response.data;
      setStatus("saved");
      
      console.log('✅ Form saved successfully:', { 
        id, 
        newEtag: response.meta?.etag,
        version: response.meta?.version 
      });
      
      // Call success callback
      onSaveSuccess?.(response.data);
      
      // Reset to idle after showing success state
      setTimeout(() => {
        if (status === "saved") setStatus("idle");
      }, 1500);
      
      return true;
      
    } catch (error: any) {
      console.error('❌ Form save failed:', error);
      
      if (error?.status === 409) {
        setStatus("conflict");
        setErrors({ form: ['Data was modified elsewhere. Please reload and merge changes.'] });
      } else if (error?.status === 400 && error?.errors) {
        setStatus("error");
        setErrors(error.errors);
      } else {
        setStatus("error");
        setErrors({ form: ['Save failed. Please try again.'] });
      }
      
      // Call error callback
      onSaveError?.(error);
      
      return false;
    }
  }, [id, value, etag, save, validate, status, onSaveSuccess, onSaveError]);

  // Auto-save functionality
  useEffect(() => {
    if (!autosaveMs || !dirty || status === "saving") return;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      console.log('🔄 Auto-saving form...');
      commit();
    }, autosaveMs);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [dirty, value, autosaveMs, commit, status]);

  // Reset form to defaults
  const reset = useCallback(() => {
    setValue(defaults());
    setErrors({});
    setStatus("idle");
    lastSaved.current = defaults();
  }, [defaults]);

  // Update a specific field
  const updateField = useCallback((field: keyof T, newValue: any) => {
    setValue(prev => ({
      ...prev,
      [field]: newValue
    }));
  }, []);

  // Check if a specific field has errors
  const getFieldError = useCallback((field: string): string[] => {
    return errors[field] || [];
  }, [errors]);

  // Check if form has any errors
  const hasErrors = useMemo(() => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  return {
    // State
    id,
    value,
    status,
    errors,
    dirty,
    hasErrors,
    etag,
    
    // Actions
    setValue,
    updateField,
    hydrate,
    commit,
    reset,
    validate,
    
    // Utilities
    getFieldError,
    
    // Internal state setters (for advanced usage)
    setId,
    setStatus,
    setErrors,
  };
}

// Convenience hook for organization forms
export function useOrganizationForm(
  organizationId?: string,
  options?: Partial<FormModelOptions<any>>
) {
  // This would use the organization schema and API endpoints
  // Implementation would be specific to organization data structure
  // For now, this is a placeholder for the pattern
}
