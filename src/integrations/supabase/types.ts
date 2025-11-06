export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          applied_date: string
          assigned_to: string | null
          candidate_id: string
          company: string | null
          created_at: string
          id: string
          job_id: string
          notes: string | null
          sourced_by: string | null
          sourced_from: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          applied_date?: string
          assigned_to?: string | null
          candidate_id: string
          company?: string | null
          created_at?: string
          id?: string
          job_id: string
          notes?: string | null
          sourced_by?: string | null
          sourced_from?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          applied_date?: string
          assigned_to?: string | null
          candidate_id?: string
          company?: string | null
          created_at?: string
          id?: string
          job_id?: string
          notes?: string | null
          sourced_by?: string | null
          sourced_from?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          created_at: string
          email: string
          experience: string | null
          id: string
          name: string
          phone: string | null
          position: string | null
          resume_url: string | null
          skills: string[] | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          experience?: string | null
          id?: string
          name: string
          phone?: string | null
          position?: string | null
          resume_url?: string | null
          skills?: string[] | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          experience?: string | null
          id?: string
          name?: string
          phone?: string | null
          position?: string | null
          resume_url?: string | null
          skills?: string[] | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      interviews: {
        Row: {
          candidate_id: string
          created_at: string
          feedback: string | null
          id: string
          interview_date: string
          interview_type: string
          interviewer: string | null
          job_id: string
          location: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          interview_date: string
          interview_type: string
          interviewer?: string | null
          job_id: string
          location?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          interview_date?: string
          interview_type?: string
          interviewer?: string | null
          job_id?: string
          location?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          address: string | null
          age_range: string | null
          category: string | null
          commission: string | null
          company: string | null
          created_at: string
          department: string
          description: string | null
          experience: string | null
          id: string
          languages_required: string | null
          location: string
          nice_to_have: string | null
          openings: number | null
          posted_date: string
          preferred_skills: string | null
          required_skills: string | null
          requirements: string | null
          salary_max: string | null
          salary_min: string | null
          salary_range: string | null
          seo_keywords: string | null
          shift: string | null
          status: string | null
          tenure: string | null
          title: string
          type: string
          updated_at: string
          urgency: string | null
          work_mode: string | null
        }
        Insert: {
          address?: string | null
          age_range?: string | null
          category?: string | null
          commission?: string | null
          company?: string | null
          created_at?: string
          department: string
          description?: string | null
          experience?: string | null
          id?: string
          languages_required?: string | null
          location: string
          nice_to_have?: string | null
          openings?: number | null
          posted_date?: string
          preferred_skills?: string | null
          required_skills?: string | null
          requirements?: string | null
          salary_max?: string | null
          salary_min?: string | null
          salary_range?: string | null
          seo_keywords?: string | null
          shift?: string | null
          status?: string | null
          tenure?: string | null
          title: string
          type: string
          updated_at?: string
          urgency?: string | null
          work_mode?: string | null
        }
        Update: {
          address?: string | null
          age_range?: string | null
          category?: string | null
          commission?: string | null
          company?: string | null
          created_at?: string
          department?: string
          description?: string | null
          experience?: string | null
          id?: string
          languages_required?: string | null
          location?: string
          nice_to_have?: string | null
          openings?: number | null
          posted_date?: string
          preferred_skills?: string | null
          required_skills?: string | null
          requirements?: string | null
          salary_max?: string | null
          salary_min?: string | null
          salary_range?: string | null
          seo_keywords?: string | null
          shift?: string | null
          status?: string | null
          tenure?: string | null
          title?: string
          type?: string
          updated_at?: string
          urgency?: string | null
          work_mode?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
