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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          action_config: Json
          action_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_enabled: boolean
          name: string
          priority: number | null
          trigger_config: Json
          trigger_type: string
          updated_at: string
        }
        Insert: {
          action_config?: Json
          action_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean
          name: string
          priority?: number | null
          trigger_config?: Json
          trigger_type: string
          updated_at?: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean
          name?: string
          priority?: number | null
          trigger_config?: Json
          trigger_type?: string
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
          footer_link: string | null
          footer_link_text: string | null
          footer_text: string | null
          footer_website: string | null
          id: string
          inventory_page_title: string | null
          login_background_color: string | null
          login_description: string | null
          login_title: string | null
          manager_name: string | null
          multi_store_enabled: boolean
          next_invoice_number: number | null
          orders_page_title: string | null
          phone: string | null
          registered_address: string | null
          secret_path: string | null
          updated_at: string
          vat_number: string | null
          vat_registered: boolean | null
          website_url: string | null
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
          footer_link?: string | null
          footer_link_text?: string | null
          footer_text?: string | null
          footer_website?: string | null
          id?: string
          inventory_page_title?: string | null
          login_background_color?: string | null
          login_description?: string | null
          login_title?: string | null
          manager_name?: string | null
          multi_store_enabled?: boolean
          next_invoice_number?: number | null
          orders_page_title?: string | null
          phone?: string | null
          registered_address?: string | null
          secret_path?: string | null
          updated_at?: string
          vat_number?: string | null
          vat_registered?: boolean | null
          website_url?: string | null
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
          footer_link?: string | null
          footer_link_text?: string | null
          footer_text?: string | null
          footer_website?: string | null
          id?: string
          inventory_page_title?: string | null
          login_background_color?: string | null
          login_description?: string | null
          login_title?: string | null
          manager_name?: string | null
          multi_store_enabled?: boolean
          next_invoice_number?: number | null
          orders_page_title?: string | null
          phone?: string | null
          registered_address?: string | null
          secret_path?: string | null
          updated_at?: string
          vat_number?: string | null
          vat_registered?: boolean | null
          website_url?: string | null
        }
        Relationships: []
      }
      connectix_messages: {
        Row: {
          channel: string
          created_at: string
          customer_name: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          is_sandbox: boolean | null
          message_id: string | null
          order_id: number | null
          phone: string
          read_at: string | null
          sent_at: string
          status: string
          template_id: string | null
          template_name: string | null
          trigger_status: string | null
          trigger_type: string | null
        }
        Insert: {
          channel: string
          created_at?: string
          customer_name?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          is_sandbox?: boolean | null
          message_id?: string | null
          order_id?: number | null
          phone: string
          read_at?: string | null
          sent_at?: string
          status?: string
          template_id?: string | null
          template_name?: string | null
          trigger_status?: string | null
          trigger_type?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          customer_name?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          is_sandbox?: boolean | null
          message_id?: string | null
          order_id?: number | null
          phone?: string
          read_at?: string | null
          sent_at?: string
          status?: string
          template_id?: string | null
          template_name?: string | null
          trigger_status?: string | null
          trigger_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connectix_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connectix_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_full"
            referencedColumns: ["id"]
          },
        ]
      }
      courier_api_settings: {
        Row: {
          api_key: string | null
          api_url: string | null
          client_id: string | null
          client_secret: string | null
          courier_id: string
          created_at: string
          extra_config: Json | null
          id: string
          is_enabled: boolean | null
          is_test_mode: boolean | null
          password: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          api_key?: string | null
          api_url?: string | null
          client_id?: string | null
          client_secret?: string | null
          courier_id: string
          created_at?: string
          extra_config?: Json | null
          id?: string
          is_enabled?: boolean | null
          is_test_mode?: boolean | null
          password?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          api_key?: string | null
          api_url?: string | null
          client_id?: string | null
          client_secret?: string | null
          courier_id?: string
          created_at?: string
          extra_config?: Json | null
          id?: string
          is_enabled?: boolean | null
          is_test_mode?: boolean | null
          password?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courier_api_settings_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: true
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
        ]
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
      credit_notes: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          credit_note_number: number
          id: string
          invoice_id: string | null
          issue_date: string
          order_id: number | null
          reason: string | null
          total_amount: number
          vat_amount: number | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          credit_note_number: number
          id?: string
          invoice_id?: string | null
          issue_date?: string
          order_id?: number | null
          reason?: string | null
          total_amount: number
          vat_amount?: number | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          credit_note_number?: number
          id?: string
          invoice_id?: string | null
          issue_date?: string
          order_id?: number | null
          reason?: string | null
          total_amount?: number
          vat_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_full"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notes: {
        Row: {
          created_at: string
          created_by: string | null
          created_by_email: string | null
          customer_id: string
          id: string
          note: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          customer_id: string
          id?: string
          note: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          customer_id?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          first_order_date: string | null
          id: string
          last_order_date: string | null
          name: string
          phone: string | null
          tags: string[] | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_order_date?: string | null
          id?: string
          last_order_date?: string | null
          name: string
          phone?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_order_date?: string | null
          id?: string
          last_order_date?: string | null
          name?: string
          phone?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ecommerce_platforms: {
        Row: {
          config: Json | null
          created_at: string
          display_name: string
          id: string
          is_enabled: boolean
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          display_name: string
          id?: string
          is_enabled?: boolean
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          display_name?: string
          id?: string
          is_enabled?: boolean
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string
          id: string
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_products: {
        Row: {
          barcode: string | null
          category_id: string | null
          created_at: string
          current_stock: number
          description: string | null
          external_bundle_type: string | null
          id: string
          is_active: boolean
          is_bundle: boolean
          min_stock_level: number | null
          name: string
          purchase_price: number | null
          reserved_stock: number
          sale_price: number | null
          sku: string
          unit_id: string | null
          updated_at: string
          woocommerce_id: number | null
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          created_at?: string
          current_stock?: number
          description?: string | null
          external_bundle_type?: string | null
          id?: string
          is_active?: boolean
          is_bundle?: boolean
          min_stock_level?: number | null
          name: string
          purchase_price?: number | null
          reserved_stock?: number
          sale_price?: number | null
          sku: string
          unit_id?: string | null
          updated_at?: string
          woocommerce_id?: number | null
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          created_at?: string
          current_stock?: number
          description?: string | null
          external_bundle_type?: string | null
          id?: string
          is_active?: boolean
          is_bundle?: boolean
          min_stock_level?: number | null
          name?: string
          purchase_price?: number | null
          reserved_stock?: number
          sale_price?: number | null
          sku?: string
          unit_id?: string | null
          updated_at?: string
          woocommerce_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_products_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_full"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempt_time: string
          email: string | null
          id: string
          ip_address: string
          success: boolean
        }
        Insert: {
          attempt_time?: string
          email?: string | null
          id?: string
          ip_address: string
          success?: boolean
        }
        Update: {
          attempt_time?: string
          email?: string | null
          id?: string
          ip_address?: string
          success?: boolean
        }
        Relationships: []
      }
      order_history: {
        Row: {
          action: string
          created_at: string
          field_changed: string | null
          id: string
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          order_id: number
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          field_changed?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          order_id: number
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          field_changed?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          order_id?: number
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_full"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          catalog_number: string | null
          created_at: string
          id: string
          order_id: number
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          catalog_number?: string | null
          created_at?: string
          id?: string
          order_id: number
          product_name: string
          quantity?: number
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          catalog_number?: string | null
          created_at?: string
          id?: string
          order_id?: number
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_full"
            referencedColumns: ["id"]
          },
        ]
      }
      order_statuses: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          is_default: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_default?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_default?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      order_templates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          template_data: Json
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          template_data?: Json
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          template_data?: Json
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          catalog_number: string | null
          code: string
          comment: string | null
          courier_id: string | null
          courier_tracking_url: string | null
          created_at: string
          currency: string
          currency_symbol: string
          customer_email: string | null
          customer_name: string
          delivery_address: string | null
          id: number
          is_correct: boolean | null
          paid_amount: number
          payment_date: string | null
          payment_method: string | null
          payment_status: string
          phone: string
          product_name: string
          quantity: number
          source: string | null
          status: string
          stock_deducted: boolean
          store_id: string | null
          total_price: number
          user_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          catalog_number?: string | null
          code: string
          comment?: string | null
          courier_id?: string | null
          courier_tracking_url?: string | null
          created_at?: string
          currency?: string
          currency_symbol?: string
          customer_email?: string | null
          customer_name: string
          delivery_address?: string | null
          id?: number
          is_correct?: boolean | null
          paid_amount?: number
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string
          phone: string
          product_name: string
          quantity?: number
          source?: string | null
          status?: string
          stock_deducted?: boolean
          store_id?: string | null
          total_price: number
          user_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          catalog_number?: string | null
          code?: string
          comment?: string | null
          courier_id?: string | null
          courier_tracking_url?: string | null
          created_at?: string
          currency?: string
          currency_symbol?: string
          customer_email?: string | null
          customer_name?: string
          delivery_address?: string | null
          id?: number
          is_correct?: boolean | null
          paid_amount?: number
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string
          phone?: string
          product_name?: string
          quantity?: number
          source?: string | null
          status?: string
          stock_deducted?: boolean
          store_id?: string | null
          total_price?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      outgoing_webhooks: {
        Row: {
          created_at: string
          created_by: string | null
          events: string[]
          failure_count: number | null
          headers: Json | null
          id: string
          is_enabled: boolean
          last_triggered_at: string | null
          name: string
          secret_key: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          events?: string[]
          failure_count?: number | null
          headers?: Json | null
          id?: string
          is_enabled?: boolean
          last_triggered_at?: string | null
          name: string
          secret_key?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          events?: string[]
          failure_count?: number | null
          headers?: Json | null
          id?: string
          is_enabled?: boolean
          last_triggered_at?: string | null
          name?: string
          secret_key?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      price_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          field_changed: string
          id: string
          new_value: number | null
          old_value: number | null
          product_id: string
          reason: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          field_changed: string
          id?: string
          new_value?: number | null
          old_value?: number | null
          product_id: string
          reason?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          field_changed?: string
          id?: string
          new_value?: number | null
          old_value?: number | null
          product_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_bundles: {
        Row: {
          component_product_id: string
          component_quantity: number
          created_at: string
          id: string
          parent_product_id: string
          updated_at: string
        }
        Insert: {
          component_product_id: string
          component_quantity?: number
          created_at?: string
          id?: string
          parent_product_id: string
          updated_at?: string
        }
        Update: {
          component_product_id?: string
          component_quantity?: number
          created_at?: string
          id?: string
          parent_product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_bundles_component_product_id_fkey"
            columns: ["component_product_id"]
            isOneToOne: false
            referencedRelation: "inventory_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_bundles_parent_product_id_fkey"
            columns: ["parent_product_id"]
            isOneToOne: false
            referencedRelation: "inventory_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt: string | null
          cached_url: string | null
          content_hash: string | null
          created_at: string
          external_image_id: string | null
          file_size: number | null
          height: number | null
          id: string
          last_fetched_at: string | null
          original_url: string
          position: number
          product_id: string
          thumbnail_url: string | null
          updated_at: string
          width: number | null
        }
        Insert: {
          alt?: string | null
          cached_url?: string | null
          content_hash?: string | null
          created_at?: string
          external_image_id?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          last_fetched_at?: string | null
          original_url: string
          position?: number
          product_id: string
          thumbnail_url?: string | null
          updated_at?: string
          width?: number | null
        }
        Update: {
          alt?: string | null
          cached_url?: string | null
          content_hash?: string | null
          created_at?: string
          external_image_id?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          last_fetched_at?: string | null
          original_url?: string
          position?: number
          product_id?: string
          thumbnail_url?: string | null
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_products"
            referencedColumns: ["id"]
          },
        ]
      }
      return_items: {
        Row: {
          catalog_number: string | null
          condition: string | null
          created_at: string
          id: string
          product_name: string
          quantity: number
          reason: string | null
          restock: boolean
          return_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          catalog_number?: string | null
          condition?: string | null
          created_at?: string
          id?: string
          product_name: string
          quantity?: number
          reason?: string | null
          restock?: boolean
          return_id: string
          total_price?: number
          unit_price?: number
        }
        Update: {
          catalog_number?: string | null
          condition?: string | null
          created_at?: string
          id?: string
          product_name?: string
          quantity?: number
          reason?: string | null
          restock?: boolean
          return_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "returns"
            referencedColumns: ["id"]
          },
        ]
      }
      returns: {
        Row: {
          created_at: string
          created_by: string | null
          credit_note_id: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          order_id: number | null
          reason: string
          reason_details: string | null
          refund_amount: number | null
          refund_method: string | null
          return_type: string
          status: string
          stock_restored: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          credit_note_id?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          order_id?: number | null
          reason: string
          reason_details?: string | null
          refund_amount?: number | null
          refund_method?: string | null
          return_type?: string
          status?: string
          stock_restored?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          credit_note_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          order_id?: number | null
          reason?: string
          reason_details?: string | null
          refund_amount?: number | null
          refund_method?: string | null
          return_type?: string
          status?: string
          stock_restored?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "returns_credit_note_id_fkey"
            columns: ["credit_note_id"]
            isOneToOne: false
            referencedRelation: "credit_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_full"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string
          id: string
          module: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string
          id?: string
          module: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string
          id?: string
          module?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      scheduled_actions: {
        Row: {
          action_config: Json
          action_type: string
          created_at: string
          error_message: string | null
          executed_at: string | null
          id: string
          order_id: number | null
          rule_id: string | null
          scheduled_for: string
          status: string
        }
        Insert: {
          action_config?: Json
          action_type: string
          created_at?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          order_id?: number | null
          rule_id?: string | null
          scheduled_for: string
          status?: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          created_at?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          order_id?: number | null
          rule_id?: string | null
          scheduled_for?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_actions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_actions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_actions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          cod_amount: number | null
          courier_id: string
          courier_response: Json | null
          created_at: string
          declared_value: number | null
          delivery_type: string | null
          id: string
          label_url: string | null
          notes: string | null
          order_id: number | null
          recipient_address: string | null
          recipient_city: string | null
          recipient_name: string
          recipient_office_code: string | null
          recipient_phone: string
          sender_address: string | null
          sender_city: string | null
          sender_name: string | null
          sender_office_code: string | null
          sender_phone: string | null
          service_type: string | null
          status: string | null
          updated_at: string
          waybill_number: string
          weight: number | null
        }
        Insert: {
          cod_amount?: number | null
          courier_id: string
          courier_response?: Json | null
          created_at?: string
          declared_value?: number | null
          delivery_type?: string | null
          id?: string
          label_url?: string | null
          notes?: string | null
          order_id?: number | null
          recipient_address?: string | null
          recipient_city?: string | null
          recipient_name: string
          recipient_office_code?: string | null
          recipient_phone: string
          sender_address?: string | null
          sender_city?: string | null
          sender_name?: string | null
          sender_office_code?: string | null
          sender_phone?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string
          waybill_number: string
          weight?: number | null
        }
        Update: {
          cod_amount?: number | null
          courier_id?: string
          courier_response?: Json | null
          created_at?: string
          declared_value?: number | null
          delivery_type?: string | null
          id?: string
          label_url?: string | null
          notes?: string | null
          order_id?: number | null
          recipient_address?: string | null
          recipient_city?: string | null
          recipient_name?: string
          recipient_office_code?: string | null
          recipient_phone?: string
          sender_address?: string | null
          sender_city?: string | null
          sender_name?: string | null
          sender_office_code?: string | null
          sender_phone?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string
          waybill_number?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_full"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_alerts: {
        Row: {
          alert_type: string
          created_at: string
          current_stock: number
          id: string
          is_read: boolean
          product_id: string
          resolved_at: string | null
          threshold: number
        }
        Insert: {
          alert_type?: string
          created_at?: string
          current_stock: number
          id?: string
          is_read?: boolean
          product_id: string
          resolved_at?: string | null
          threshold: number
        }
        Update: {
          alert_type?: string
          created_at?: string
          current_stock?: number
          id?: string
          is_read?: boolean
          product_id?: string
          resolved_at?: string | null
          threshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_batches: {
        Row: {
          batch_number: string
          created_at: string
          expiry_date: string | null
          id: string
          notes: string | null
          product_id: string
          purchase_price: number | null
          quantity: number
          received_date: string
          remaining_quantity: number
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          batch_number: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          product_id: string
          purchase_price?: number | null
          quantity?: number
          received_date?: string
          remaining_quantity?: number
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          batch_number?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          purchase_price?: number | null
          quantity?: number
          received_date?: string
          remaining_quantity?: number
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_batches_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_by_warehouse: {
        Row: {
          created_at: string
          current_stock: number
          id: string
          min_stock_level: number | null
          product_id: string
          reserved_stock: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          current_stock?: number
          id?: string
          min_stock_level?: number | null
          product_id: string
          reserved_stock?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          current_stock?: number
          id?: string
          min_stock_level?: number | null
          product_id?: string
          reserved_stock?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_by_warehouse_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_by_warehouse_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_documents: {
        Row: {
          counterparty_name: string | null
          created_at: string
          created_by: string | null
          document_date: string
          document_number: string
          document_type: Database["public"]["Enums"]["document_type"]
          id: string
          notes: string | null
          supplier_id: string | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          counterparty_name?: string | null
          created_at?: string
          created_by?: string | null
          document_date?: string
          document_number: string
          document_type: Database["public"]["Enums"]["document_type"]
          id?: string
          notes?: string | null
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          counterparty_name?: string | null
          created_at?: string
          created_by?: string | null
          document_date?: string
          document_number?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          notes?: string | null
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_documents_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          batch_id: string | null
          created_at: string
          created_by: string | null
          document_id: string | null
          id: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          product_id: string
          quantity: number
          reason: string | null
          stock_after: number
          stock_before: number
          total_price: number | null
          unit_price: number | null
          warehouse_id: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          id?: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          product_id: string
          quantity: number
          reason?: string | null
          stock_after?: number
          stock_before?: number
          total_price?: number | null
          unit_price?: number | null
          warehouse_id?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          id?: string
          movement_type?: Database["public"]["Enums"]["movement_type"]
          product_id?: string
          quantity?: number
          reason?: string | null
          stock_after?: number
          stock_before?: number
          total_price?: number | null
          unit_price?: number | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "stock_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "stock_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          currency: string
          currency_symbol: string
          flag_emoji: string
          id: string
          is_enabled: boolean
          is_primary: boolean
          name: string
          sort_order: number
          updated_at: string
          wc_consumer_key: string | null
          wc_consumer_secret: string | null
          wc_url: string | null
          wc_webhook_secret: string | null
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          currency?: string
          currency_symbol?: string
          flag_emoji: string
          id?: string
          is_enabled?: boolean
          is_primary?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          wc_consumer_key?: string | null
          wc_consumer_secret?: string | null
          wc_url?: string | null
          wc_webhook_secret?: string | null
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          currency?: string
          currency_symbol?: string
          flag_emoji?: string
          id?: string
          is_enabled?: boolean
          is_primary?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          wc_consumer_key?: string | null
          wc_consumer_secret?: string | null
          wc_url?: string | null
          wc_webhook_secret?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          eik: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          eik?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          eik?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      sync_job_logs: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          job_id: string
          level: string
          message: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          job_id: string
          level?: string
          message: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          job_id?: string
          level?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_job_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "sync_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          failed_items: number | null
          id: string
          job_type: string
          metadata: Json | null
          platform: string | null
          processed_items: number | null
          started_at: string | null
          started_by: string | null
          status: string
          total_items: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          failed_items?: number | null
          id?: string
          job_type: string
          metadata?: Json | null
          platform?: string | null
          processed_items?: number | null
          started_at?: string | null
          started_by?: string | null
          status?: string
          total_items?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          failed_items?: number | null
          id?: string
          job_type?: string
          metadata?: Json | null
          platform?: string | null
          processed_items?: number | null
          started_at?: string | null
          started_by?: string | null
          status?: string
          total_items?: number | null
        }
        Relationships: []
      }
      theme_preferences: {
        Row: {
          ip_address: string
          theme: string
          updated_at: string
        }
        Insert: {
          ip_address: string
          theme?: string
          updated_at?: string
        }
        Update: {
          ip_address?: string
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      units_of_measure: {
        Row: {
          abbreviation: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          abbreviation: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          abbreviation?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          address: string | null
          city: string | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          delivered_at: string
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          success: boolean
          webhook_id: string
        }
        Insert: {
          delivered_at?: string
          event_type: string
          id?: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          success?: boolean
          webhook_id: string
        }
        Update: {
          delivered_at?: string
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          success?: boolean
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "outgoing_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          attempts: number
          created_at: string
          error_message: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json | null
          platform: string
          processed: boolean
          processed_at: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          event_id: string
          event_type?: string
          id?: string
          payload?: Json | null
          platform: string
          processed?: boolean
          processed_at?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json | null
          platform?: string
          processed?: boolean
          processed_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      orders_full: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          catalog_number: string | null
          code: string | null
          comment: string | null
          courier_id: string | null
          courier_tracking_url: string | null
          created_at: string | null
          currency: string | null
          currency_symbol: string | null
          customer_email: string | null
          customer_name: string | null
          delivery_address: string | null
          id: number | null
          is_correct: boolean | null
          items: Json | null
          items_count: number | null
          latest_shipment_status: string | null
          latest_waybill: string | null
          paid_amount: number | null
          payment_date: string | null
          payment_method: string | null
          payment_status: string | null
          phone: string | null
          product_name: string | null
          quantity: number | null
          shipments: Json | null
          shipments_count: number | null
          source: string | null
          status: string | null
          stock_deducted: boolean | null
          store_id: string | null
          total_price: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_duplicate_order: {
        Args: { _hours?: number; _phone: string; _product_name: string }
        Returns: {
          duplicate_code: string
          duplicate_date: string
          duplicate_id: number
          similarity_score: number
        }[]
      }
      cleanup_old_login_attempts: { Args: never; Returns: undefined }
      generate_document_number: {
        Args: { doc_type: Database["public"]["Enums"]["document_type"] }
        Returns: string
      }
      has_permission: {
        Args: { _action: string; _email: string; _module: string }
        Returns: boolean
      }
      is_admin: { Args: { _email: string }; Returns: boolean }
      is_allowed_user: { Args: { _email: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "warehouse_worker"
        | "order_operator"
        | "finance"
      document_type:
        | "receiving"
        | "dispatch"
        | "adjustment"
        | "return"
        | "inventory"
      movement_type: "in" | "out" | "adjustment" | "return" | "transfer"
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
      app_role: [
        "admin",
        "user",
        "warehouse_worker",
        "order_operator",
        "finance",
      ],
      document_type: [
        "receiving",
        "dispatch",
        "adjustment",
        "return",
        "inventory",
      ],
      movement_type: ["in", "out", "adjustment", "return", "transfer"],
    },
  },
} as const
