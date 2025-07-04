export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          company_name: string
          created_at: string
          dba_name: string | null
          external_app_id: number | null
          external_app_number: string | null
          id: string
          industry: string | null
          last_synced_at: string | null
          state: string | null
          updated_at: string
          user_id: string
          webhook_metadata: Json | null
          years_in_business: number | null
          zip_code: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name: string
          created_at?: string
          dba_name?: string | null
          external_app_id?: number | null
          external_app_number?: string | null
          id?: string
          industry?: string | null
          last_synced_at?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          webhook_metadata?: Json | null
          years_in_business?: number | null
          zip_code?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string
          created_at?: string
          dba_name?: string | null
          external_app_id?: number | null
          external_app_number?: string | null
          id?: string
          industry?: string | null
          last_synced_at?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          webhook_metadata?: Json | null
          years_in_business?: number | null
          zip_code?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company_id: string
          contact_name: string
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          phone: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          contact_name: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          phone?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          contact_name?: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          phone?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_activities: {
        Row: {
          activity_type: string
          category: string
          created_at: string | null
          deal_id: string
          description: string | null
          id: string
          mentioned_users: string[] | null
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          activity_type: string
          category: string
          created_at?: string | null
          deal_id: string
          description?: string | null
          id?: string
          mentioned_users?: string[] | null
          metadata?: Json | null
          title: string
          user_id: string
        }
        Update: {
          activity_type?: string
          category?: string
          created_at?: string | null
          deal_id?: string
          description?: string | null
          id?: string
          mentioned_users?: string[] | null
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_audit_log: {
        Row: {
          action: string
          created_at: string
          deal_id: string
          id: string
          new_values: Json | null
          old_values: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          deal_id: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          deal_id?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_audit_log_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_documents: {
        Row: {
          created_at: string
          deal_id: string
          document_category: string
          file_path: string
          file_size: number
          file_type: string
          filename: string
          id: string
          ocr_data: Json | null
          ocr_status: string | null
          original_filename: string
          updated_at: string
          upload_status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          document_category: string
          file_path: string
          file_size: number
          file_type: string
          filename: string
          id?: string
          ocr_data?: Json | null
          ocr_status?: string | null
          original_filename: string
          updated_at?: string
          upload_status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          document_category?: string
          file_path?: string
          file_size?: number
          file_type?: string
          filename?: string
          id?: string
          ocr_data?: Json | null
          ocr_status?: string | null
          original_filename?: string
          updated_at?: string
          upload_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_underwriting_checklist: {
        Row: {
          bank_statements_reviewed: boolean | null
          credit_checked: boolean | null
          deal_id: string
          documents_complete: boolean | null
          id: string
          updated_at: string | null
          updated_by: string
          user_id: string
        }
        Insert: {
          bank_statements_reviewed?: boolean | null
          credit_checked?: boolean | null
          deal_id: string
          documents_complete?: boolean | null
          id?: string
          updated_at?: string | null
          updated_by: string
          user_id: string
        }
        Update: {
          bank_statements_reviewed?: boolean | null
          credit_checked?: boolean | null
          deal_id?: string
          documents_complete?: boolean | null
          id?: string
          updated_at?: string | null
          updated_by?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_underwriting_checklist_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          amount_requested: number
          average_daily_balance: number | null
          company_id: string | null
          company_name: string
          contact_name: string | null
          created_at: string
          credit_score: number | null
          deal_number: string
          decline_reason: string | null
          deleted_at: string | null
          email: string | null
          factor_rate: number | null
          id: string
          iso_id: string | null
          iso_name: string | null
          monthly_revenue: number | null
          phone: string | null
          stage: string
          term_months: number | null
          underwriter_id: string | null
          underwriting_date: string | null
          underwriting_notes: string | null
          underwriting_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_requested: number
          average_daily_balance?: number | null
          company_id?: string | null
          company_name: string
          contact_name?: string | null
          created_at?: string
          credit_score?: number | null
          deal_number?: string
          decline_reason?: string | null
          deleted_at?: string | null
          email?: string | null
          factor_rate?: number | null
          id?: string
          iso_id?: string | null
          iso_name?: string | null
          monthly_revenue?: number | null
          phone?: string | null
          stage?: string
          term_months?: number | null
          underwriter_id?: string | null
          underwriting_date?: string | null
          underwriting_notes?: string | null
          underwriting_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_requested?: number
          average_daily_balance?: number | null
          company_id?: string | null
          company_name?: string
          contact_name?: string | null
          created_at?: string
          credit_score?: number | null
          deal_number?: string
          decline_reason?: string | null
          deleted_at?: string | null
          email?: string | null
          factor_rate?: number | null
          id?: string
          iso_id?: string | null
          iso_name?: string | null
          monthly_revenue?: number | null
          phone?: string | null
          stage?: string
          term_months?: number | null
          underwriter_id?: string | null
          underwriting_date?: string | null
          underwriting_notes?: string | null
          underwriting_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_iso_id_fkey"
            columns: ["iso_id"]
            isOneToOne: false
            referencedRelation: "isos"
            referencedColumns: ["id"]
          },
        ]
      }
      document_metadata: {
        Row: {
          created_at: string | null
          id: string
          schema: string | null
          title: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          schema?: string | null
          title?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          schema?: string | null
          title?: string | null
          url?: string | null
        }
        Relationships: []
      }
      document_rows: {
        Row: {
          dataset_id: string | null
          id: number
          row_data: Json | null
        }
        Insert: {
          dataset_id?: string | null
          id?: number
          row_data?: Json | null
        }
        Update: {
          dataset_id?: string | null
          id?: number
          row_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_rows_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "document_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      isos: {
        Row: {
          commission_rate: number | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          iso_name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_rate?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          iso_name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_rate?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          iso_name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          amount: number
          buy_rate: number | null
          created_at: string
          daily_payment: number | null
          deal_id: string
          expires_at: string | null
          factor_rate: number
          id: string
          iso_commission: number | null
          iso_commission_rate: number | null
          notes: string | null
          offer_number: string
          payment_frequency: string
          responded_at: string | null
          sent_at: string | null
          status: string
          term_months: number
          total_payback: number | null
          updated_at: string
          user_id: string
          version: number
          viewed_at: string | null
          weekly_payment: number | null
        }
        Insert: {
          amount: number
          buy_rate?: number | null
          created_at?: string
          daily_payment?: number | null
          deal_id: string
          expires_at?: string | null
          factor_rate?: number
          id?: string
          iso_commission?: number | null
          iso_commission_rate?: number | null
          notes?: string | null
          offer_number: string
          payment_frequency?: string
          responded_at?: string | null
          sent_at?: string | null
          status?: string
          term_months?: number
          total_payback?: number | null
          updated_at?: string
          user_id: string
          version?: number
          viewed_at?: string | null
          weekly_payment?: number | null
        }
        Update: {
          amount?: number
          buy_rate?: number | null
          created_at?: string
          daily_payment?: number | null
          deal_id?: string
          expires_at?: string | null
          factor_rate?: number
          id?: string
          iso_commission?: number | null
          iso_commission_rate?: number | null
          notes?: string | null
          offer_number?: string
          payment_frequency?: string
          responded_at?: string | null
          sent_at?: string | null
          status?: string
          term_months?: number
          total_payback?: number | null
          updated_at?: string
          user_id?: string
          version?: number
          viewed_at?: string | null
          weekly_payment?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_role: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          company_role?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          company_role?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      scorecard_sections: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          scorecard_id: string
          section_data: Json
          section_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          scorecard_id: string
          section_data: Json
          section_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          scorecard_id?: string
          section_data?: Json
          section_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scorecard_sections_scorecard_id_fkey"
            columns: ["scorecard_id"]
            isOneToOne: false
            referencedRelation: "scorecards"
            referencedColumns: ["id"]
          },
        ]
      }
      scorecards: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          deal_id: string | null
          error_message: string | null
          external_app_id: number | null
          id: string
          requested_at: string
          scorecard_url: string | null
          status: string
          updated_at: string
          user_id: string
          webhook_request_data: Json | null
          webhook_response_data: Json | null
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string
          deal_id?: string | null
          error_message?: string | null
          external_app_id?: number | null
          id?: string
          requested_at?: string
          scorecard_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
          webhook_request_data?: Json | null
          webhook_response_data?: Json | null
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          deal_id?: string | null
          error_message?: string | null
          external_app_id?: number | null
          id?: string
          requested_at?: string
          scorecard_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          webhook_request_data?: Json | null
          webhook_response_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "scorecards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scorecards_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      generate_deal_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_offer_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_documents: {
        Args: { query_embedding: string; match_count?: number; filter?: Json }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      restore_deal: {
        Args: { deal_id: string }
        Returns: boolean
      }
      soft_delete_deal: {
        Args: { deal_id: string }
        Returns: boolean
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
