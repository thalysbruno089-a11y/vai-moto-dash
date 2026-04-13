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
      balance_differences: {
        Row: {
          available_balance: number
          bill_id: string | null
          bill_name: string
          bill_value: number
          company_id: string
          created_at: string
          difference_amount: number
          id: string
          source: string
        }
        Insert: {
          available_balance?: number
          bill_id?: string | null
          bill_name: string
          bill_value: number
          company_id: string
          created_at?: string
          difference_amount: number
          id?: string
          source: string
        }
        Update: {
          available_balance?: number
          bill_id?: string | null
          bill_name?: string
          bill_value?: number
          company_id?: string
          created_at?: string
          difference_amount?: number
          id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "balance_differences_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_differences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          category_id: string | null
          company_id: string
          created_at: string
          description: string | null
          due_date: string
          id: string
          installment_number: number | null
          is_fixed: boolean
          name: string
          paid_at: string | null
          paid_installments: number | null
          parent_bill_id: string | null
          status: string
          total_installments: number | null
          updated_at: string
          vale_amount: number | null
          value: number
        }
        Insert: {
          category_id?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          installment_number?: number | null
          is_fixed?: boolean
          name: string
          paid_at?: string | null
          paid_installments?: number | null
          parent_bill_id?: string | null
          status?: string
          total_installments?: number | null
          updated_at?: string
          vale_amount?: number | null
          value: number
        }
        Update: {
          category_id?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          installment_number?: number | null
          is_fixed?: boolean
          name?: string
          paid_at?: string | null
          paid_installments?: number | null
          parent_bill_id?: string | null
          status?: string
          total_installments?: number | null
          updated_at?: string
          vale_amount?: number | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "bills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_parent_bill_id_fkey"
            columns: ["parent_bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow: {
        Row: {
          category_id: string | null
          company_id: string
          created_at: string
          description: string | null
          flow_date: string
          id: string
          is_recurring: boolean
          type: Database["public"]["Enums"]["flow_type"]
          updated_at: string
          value: number
        }
        Insert: {
          category_id?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          flow_date?: string
          id?: string
          is_recurring?: boolean
          type: Database["public"]["Enums"]["flow_type"]
          updated_at?: string
          value: number
        }
        Update: {
          category_id?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          flow_date?: string
          id?: string
          is_recurring?: boolean
          type?: Database["public"]["Enums"]["flow_type"]
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_flow_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          company_id: string
          created_at: string
          group_name: string
          id: string
          name: string
          type: Database["public"]["Enums"]["flow_type"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          group_name?: string
          id?: string
          name: string
          type: Database["public"]["Enums"]["flow_type"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          group_name?: string
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["flow_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          company_id: string
          created_at: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_id: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      loan_payments: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          id: string
          loan_id: string
          notes: string | null
          payment_date: string
          payment_type: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          id?: string
          loan_id: string
          notes?: string | null
          payment_date?: string
          payment_type?: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          id?: string
          loan_id?: string
          notes?: string | null
          payment_date?: string
          payment_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          company_id: string
          created_at: string
          due_date: string | null
          id: string
          interest_rate: number
          notes: string | null
          person_name: string
          principal_amount: number
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          interest_rate: number
          notes?: string | null
          person_name: string
          principal_amount: number
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          interest_rate?: number
          notes?: string | null
          person_name?: string
          principal_amount?: number
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_closings: {
        Row: {
          company_id: string
          created_at: string | null
          expense: number
          id: string
          income: number
          month: number
          year: number
        }
        Insert: {
          company_id: string
          created_at?: string | null
          expense?: number
          id?: string
          income?: number
          month: number
          year: number
        }
        Update: {
          company_id?: string
          created_at?: string | null
          expense?: number
          id?: string
          income?: number
          month?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_closings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      motoboys: {
        Row: {
          address: string | null
          company_id: string
          cpf: string | null
          created_at: string
          id: string
          name: string
          number: string | null
          payment_status: string | null
          phone: string | null
          pix_key: string | null
          shift: Database["public"]["Enums"]["shift_type"]
          status: Database["public"]["Enums"]["status_type"]
          updated_at: string
          weekly_payment: number | null
        }
        Insert: {
          address?: string | null
          company_id: string
          cpf?: string | null
          created_at?: string
          id?: string
          name: string
          number?: string | null
          payment_status?: string | null
          phone?: string | null
          pix_key?: string | null
          shift?: Database["public"]["Enums"]["shift_type"]
          status?: Database["public"]["Enums"]["status_type"]
          updated_at?: string
          weekly_payment?: number | null
        }
        Update: {
          address?: string | null
          company_id?: string
          cpf?: string | null
          created_at?: string
          id?: string
          name?: string
          number?: string | null
          payment_status?: string | null
          phone?: string | null
          pix_key?: string | null
          shift?: Database["public"]["Enums"]["shift_type"]
          status?: Database["public"]["Enums"]["status_type"]
          updated_at?: string
          weekly_payment?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "motoboys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      motorcycle_expenses: {
        Row: {
          category: string
          company_id: string
          created_at: string
          description: string | null
          id: string
          mileage: number | null
          plate: string | null
          service_date: string
          updated_at: string
          value: number
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          mileage?: number | null
          plate?: string | null
          service_date?: string
          updated_at?: string
          value: number
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          mileage?: number | null
          plate?: string | null
          service_date?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "motorcycle_expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      motorcycle_rentals: {
        Row: {
          color: string
          company_id: string
          created_at: string
          daily_rate: number
          id: string
          notes: string | null
          pickup_date: string
          plate: string
          renter_name: string
          renter_phone: string | null
          return_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          color: string
          company_id: string
          created_at?: string
          daily_rate: number
          id?: string
          notes?: string | null
          pickup_date?: string
          plate: string
          renter_name: string
          renter_phone?: string | null
          return_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          color?: string
          company_id?: string
          created_at?: string
          daily_rate?: number
          id?: string
          notes?: string | null
          pickup_date?: string
          plate?: string
          renter_name?: string
          renter_phone?: string | null
          return_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "motorcycle_rentals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      motorcycles: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string | null
          plate: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name?: string | null
          plate: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string | null
          plate?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "motorcycles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          client_id: string | null
          company_id: string
          created_at: string
          id: string
          motoboy_id: string | null
          notes: string | null
          order_date: string
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
          value: number
        }
        Insert: {
          client_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          motoboy_id?: string | null
          notes?: string | null
          order_date?: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          value?: number
        }
        Update: {
          client_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          motoboy_id?: string | null
          notes?: string | null
          order_date?: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_motoboy_id_fkey"
            columns: ["motoboy_id"]
            isOneToOne: false
            referencedRelation: "motoboys"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          company_id: string
          created_at: string
          id: string
          motoboy_id: string | null
          paid_at: string | null
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          value: number
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          motoboy_id?: string | null
          paid_at?: string | null
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          value?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          motoboy_id?: string | null
          paid_at?: string | null
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_motoboy_id_fkey"
            columns: ["motoboy_id"]
            isOneToOne: false
            referencedRelation: "motoboys"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          id: string
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      rides: {
        Row: {
          client_id: string
          company_id: string
          created_at: string
          id: string
          motoboy_id: string
          notes: string | null
          payment_status: string
          ride_date: string
          updated_at: string
          value: number
        }
        Insert: {
          client_id: string
          company_id: string
          created_at?: string
          id?: string
          motoboy_id: string
          notes?: string | null
          payment_status?: string
          ride_date?: string
          updated_at?: string
          value?: number
        }
        Update: {
          client_id?: string
          company_id?: string
          created_at?: string
          id?: string
          motoboy_id?: string
          notes?: string | null
          payment_status?: string
          ride_date?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "rides_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_motoboy_id_fkey"
            columns: ["motoboy_id"]
            isOneToOne: false
            referencedRelation: "motoboys"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_closings: {
        Row: {
          company_id: string
          created_at: string
          expense: number
          id: string
          income: number
          week_end: string
          week_start: string
        }
        Insert: {
          company_id: string
          created_at?: string
          expense?: number
          id?: string
          income?: number
          week_end: string
          week_start: string
        }
        Update: {
          company_id?: string
          created_at?: string
          expense?: number
          id?: string
          income?: number
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_closings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_company_id: { Args: never; Returns: string }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_company_access: {
        Args: { target_company_id: string }
        Returns: boolean
      }
    }
    Enums: {
      flow_type: "revenue" | "expense"
      order_status: "pending" | "in_progress" | "delivered" | "cancelled"
      payment_status: "paid" | "pending"
      shift_type: "day" | "night" | "weekend" | "star" | "free"
      status_type: "active" | "inactive"
      user_role: "admin" | "manager" | "finance" | "employee"
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
      flow_type: ["revenue", "expense"],
      order_status: ["pending", "in_progress", "delivered", "cancelled"],
      payment_status: ["paid", "pending"],
      shift_type: ["day", "night", "weekend", "star", "free"],
      status_type: ["active", "inactive"],
      user_role: ["admin", "manager", "finance", "employee"],
    },
  },
} as const
