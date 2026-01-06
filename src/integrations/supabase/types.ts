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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      allowed_users: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          name: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      api_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          bank_bic: string | null
          bank_iban: string | null
          bank_name: string | null
          company_name: string | null
          correspondence_address: string | null
          created_at: string
          eik: string | null
          email: string | null
          id: string
          manager_name: string | null
          next_invoice_number: number | null
          phone: string | null
          registered_address: string | null
          updated_at: string
          vat_number: string | null
          vat_registered: boolean | null
        }
        Insert: {
          bank_bic?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          company_name?: string | null
          correspondence_address?: string | null
          created_at?: string
          eik?: string | null
          email?: string | null
          id?: string
          manager_name?: string | null
          next_invoice_number?: number | null
          phone?: string | null
          registered_address?: string | null
          updated_at?: string
          vat_number?: string | null
          vat_registered?: boolean | null
        }
        Update: {
          bank_bic?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          company_name?: string | null
          correspondence_address?: string | null
          created_at?: string
          eik?: string | null
          email?: string | null
          id?: string
          manager_name?: string | null
          next_invoice_number?: number | null
          phone?: string | null
          registered_address?: string | null
          updated_at?: string
          vat_number?: string | null
          vat_registered?: boolean | null
        }
        Relationships: []
      }
      couriers: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          updated_at: string
          url_pattern: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
          url_pattern?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
          url_pattern?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          buyer_address: string | null
          buyer_eik: string | null
          buyer_email: string | null
          buyer_name: string
          buyer_phone: string | null
          buyer_vat_number: string | null
          created_at: string
          created_by: string | null
          id: string
          invoice_number: number
          issue_date: string
          notes: string | null
          order_id: number | null
          product_description: string
          quantity: number
          seller_address: string | null
          seller_eik: string | null
          seller_name: string
          seller_vat_number: string | null
          subtotal: number
          tax_event_date: string | null
          total_amount: number
          unit_price: number
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          buyer_address?: string | null
          buyer_eik?: string | null
          buyer_email?: string | null
          buyer_name: string
          buyer_phone?: string | null
          buyer_vat_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_number: number
          issue_date?: string
          notes?: string | null
          order_id?: number | null
          product_description: string
          quantity?: number
          seller_address?: string | null
          seller_eik?: string | null
          seller_name: string
          seller_vat_number?: string | null
          subtotal: number
          tax_event_date?: string | null
          total_amount: number
          unit_price: number
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          buyer_address?: string | null
          buyer_eik?: string | null
          buyer_email?: string | null
          buyer_name?: string
          buyer_phone?: string | null
          buyer_vat_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_number?: number
          issue_date?: string
          notes?: string | null
          order_id?: number | null
          product_description?: string
          quantity?: number
          seller_address?: string | null
          seller_eik?: string | null
          seller_name?: string
          seller_vat_number?: string | null
          subtotal?: number
          tax_event_date?: string | null
          total_amount?: number
          unit_price?: number
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          catalog_number: string | null
          code: string
          comment: string | null
          courier_tracking_url: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          delivery_address: string | null
          id: number
          is_correct: boolean | null
          phone: string
          product_name: string
          quantity: number
          source: string | null
          status: string
          total_price: number
          user_id: string | null
        }
        Insert: {
          catalog_number?: string | null
          code: string
          comment?: string | null
          courier_tracking_url?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          delivery_address?: string | null
          id?: number
          is_correct?: boolean | null
          phone: string
          product_name: string
          quantity?: number
          source?: string | null
          status?: string
          total_price: number
          user_id?: string | null
        }
        Update: {
          catalog_number?: string | null
          code?: string
          comment?: string | null
          courier_tracking_url?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          delivery_address?: string | null
          id?: number
          is_correct?: boolean | null
          phone?: string
          product_name?: string
          quantity?: number
          source?: string | null
          status?: string
          total_price?: number
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _email: string }; Returns: boolean }
      is_allowed_user: { Args: { _email: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
