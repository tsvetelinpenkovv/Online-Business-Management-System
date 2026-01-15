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
          next_invoice_number: number | null
          orders_page_title: string | null
          phone: string | null
          registered_address: string | null
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
          next_invoice_number?: number | null
          orders_page_title?: string | null
          phone?: string | null
          registered_address?: string | null
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
          next_invoice_number?: number | null
          orders_page_title?: string | null
          phone?: string | null
          registered_address?: string | null
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
      orders: {
        Row: {
          catalog_number: string | null
          code: string
          comment: string | null
          courier_id: string | null
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
          stock_deducted: boolean
          total_price: number
          user_id: string | null
        }
        Insert: {
          catalog_number?: string | null
          code: string
          comment?: string | null
          courier_id?: string | null
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
          stock_deducted?: boolean
          total_price: number
          user_id?: string | null
        }
        Update: {
          catalog_number?: string | null
          code?: string
          comment?: string | null
          courier_id?: string | null
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
          stock_deducted?: boolean
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
        ]
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
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_document_number: {
        Args: { doc_type: Database["public"]["Enums"]["document_type"] }
        Returns: string
      }
      is_admin: { Args: { _email: string }; Returns: boolean }
      is_allowed_user: { Args: { _email: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      document_type:
        | "receiving"
        | "dispatch"
        | "adjustment"
        | "return"
        | "inventory"
      movement_type: "in" | "out" | "adjustment" | "return"
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
      document_type: [
        "receiving",
        "dispatch",
        "adjustment",
        "return",
        "inventory",
      ],
      movement_type: ["in", "out", "adjustment", "return"],
    },
  },
} as const
