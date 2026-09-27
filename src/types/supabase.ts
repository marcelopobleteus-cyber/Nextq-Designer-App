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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          organization_id: string
          project_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          organization_id: string
          project_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "activity_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      bom_items: {
        Row: {
          asset_condition: Database["public"]["Enums"]["asset_condition"]
          cabinet_id: string | null
          category: string
          conduit_run_id: string | null
          conduit_structure_id: string | null
          created_at: string
          description: string
          fiber_enclosure_id: string | null
          fiber_node_id: string | null
          fiber_route_id: string | null
          id: string
          manufacturer: string | null
          material_received: boolean
          material_received_at: string | null
          module: Database["public"]["Enums"]["bom_module"]
          part_number: string | null
          project_id: string
          quantity: number
          source: Database["public"]["Enums"]["bom_source_type"]
          status: string | null
          subcategory: string | null
          supplied_by: string | null
          supply_responsibility: Database["public"]["Enums"]["supply_responsibility"]
          unit: string
          unit_cost: number
          updated_at: string | null
          work_scope: Database["public"]["Enums"]["work_scope"]
        }
        Insert: {
          asset_condition?: Database["public"]["Enums"]["asset_condition"]
          cabinet_id?: string | null
          category: string
          conduit_run_id?: string | null
          conduit_structure_id?: string | null
          created_at?: string
          description: string
          fiber_enclosure_id?: string | null
          fiber_node_id?: string | null
          fiber_route_id?: string | null
          id?: string
          manufacturer?: string | null
          material_received?: boolean
          material_received_at?: string | null
          module?: Database["public"]["Enums"]["bom_module"]
          part_number?: string | null
          project_id: string
          quantity?: number
          source?: Database["public"]["Enums"]["bom_source_type"]
          status?: string | null
          subcategory?: string | null
          supplied_by?: string | null
          supply_responsibility?: Database["public"]["Enums"]["supply_responsibility"]
          unit?: string
          unit_cost?: number
          updated_at?: string | null
          work_scope?: Database["public"]["Enums"]["work_scope"]
        }
        Update: {
          asset_condition?: Database["public"]["Enums"]["asset_condition"]
          cabinet_id?: string | null
          category?: string
          conduit_run_id?: string | null
          conduit_structure_id?: string | null
          created_at?: string
          description?: string
          fiber_enclosure_id?: string | null
          fiber_node_id?: string | null
          fiber_route_id?: string | null
          id?: string
          manufacturer?: string | null
          material_received?: boolean
          material_received_at?: string | null
          module?: Database["public"]["Enums"]["bom_module"]
          part_number?: string | null
          project_id?: string
          quantity?: number
          source?: Database["public"]["Enums"]["bom_source_type"]
          status?: string | null
          subcategory?: string | null
          supplied_by?: string | null
          supply_responsibility?: Database["public"]["Enums"]["supply_responsibility"]
          unit?: string
          unit_cost?: number
          updated_at?: string | null
          work_scope?: Database["public"]["Enums"]["work_scope"]
        }
        Relationships: [
          {
            foreignKeyName: "bom_items_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_items_conduit_run_id_fkey"
            columns: ["conduit_run_id"]
            isOneToOne: false
            referencedRelation: "conduit_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_items_conduit_structure_id_fkey"
            columns: ["conduit_structure_id"]
            isOneToOne: false
            referencedRelation: "conduit_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_items_fiber_enclosure_id_fkey"
            columns: ["fiber_enclosure_id"]
            isOneToOne: false
            referencedRelation: "fiber_enclosures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_items_fiber_node_id_fkey"
            columns: ["fiber_node_id"]
            isOneToOne: false
            referencedRelation: "fiber_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_items_fiber_route_id_fkey"
            columns: ["fiber_route_id"]
            isOneToOne: false
            referencedRelation: "fiber_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "bom_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      bom_items_removed: {
        Row: {
          id: string
          original_id: string
          payload: Json
          project_id: string
          removed_at: string
          removed_reason: string
          restored_at: string | null
        }
        Insert: {
          id?: string
          original_id: string
          payload: Json
          project_id: string
          removed_at?: string
          removed_reason: string
          restored_at?: string | null
        }
        Update: {
          id?: string
          original_id?: string
          payload?: Json
          project_id?: string
          removed_at?: string
          removed_reason?: string
          restored_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bom_items_removed_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "bom_items_removed_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cabinets: {
        Row: {
          asset_condition: Database["public"]["Enums"]["asset_condition"]
          cabinet_role: string
          cabinet_tag: string
          cabinet_type: string
          condition_source: string | null
          created_at: string
          id: string
          kit_id: string | null
          latitude: number
          longitude: number
          material_received: boolean
          material_received_at: string | null
          mount_type: string | null
          mounted_on_node_id: string | null
          notes: string | null
          organization_id: string
          owner_of_record: string | null
          project_id: string
          status: string
          supplied_by: string | null
          supply_responsibility: Database["public"]["Enums"]["supply_responsibility"]
          updated_at: string | null
          uplink_target: string | null
          work_scope: Database["public"]["Enums"]["work_scope"]
        }
        Insert: {
          asset_condition?: Database["public"]["Enums"]["asset_condition"]
          cabinet_role?: string
          cabinet_tag: string
          cabinet_type: string
          condition_source?: string | null
          created_at?: string
          id?: string
          kit_id?: string | null
          latitude: number
          longitude: number
          material_received?: boolean
          material_received_at?: string | null
          mount_type?: string | null
          mounted_on_node_id?: string | null
          notes?: string | null
          organization_id: string
          owner_of_record?: string | null
          project_id: string
          status?: string
          supplied_by?: string | null
          supply_responsibility?: Database["public"]["Enums"]["supply_responsibility"]
          updated_at?: string | null
          uplink_target?: string | null
          work_scope?: Database["public"]["Enums"]["work_scope"]
        }
        Update: {
          asset_condition?: Database["public"]["Enums"]["asset_condition"]
          cabinet_role?: string
          cabinet_tag?: string
          cabinet_type?: string
          condition_source?: string | null
          created_at?: string
          id?: string
          kit_id?: string | null
          latitude?: number
          longitude?: number
          material_received?: boolean
          material_received_at?: string | null
          mount_type?: string | null
          mounted_on_node_id?: string | null
          notes?: string | null
          organization_id?: string
          owner_of_record?: string | null
          project_id?: string
          status?: string
          supplied_by?: string | null
          supply_responsibility?: Database["public"]["Enums"]["supply_responsibility"]
          updated_at?: string | null
          uplink_target?: string | null
          work_scope?: Database["public"]["Enums"]["work_scope"]
        }
        Relationships: [
          {
            foreignKeyName: "cabinets_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "enclosure_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabinets_mounted_on_node_id_fkey"
            columns: ["mounted_on_node_id"]
            isOneToOne: false
            referencedRelation: "fiber_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabinets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabinets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "cabinets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      camera_fiber_assignment_strands: {
        Row: {
          camera_fiber_assignment_id: string
          camera_id: string
          created_at: string
          id: string
          organization_id: string
          project_id: string
          strand_id: string
          strand_role: string
          updated_at: string | null
        }
        Insert: {
          camera_fiber_assignment_id: string
          camera_id: string
          created_at?: string
          id?: string
          organization_id: string
          project_id: string
          strand_id: string
          strand_role: string
          updated_at?: string | null
        }
        Update: {
          camera_fiber_assignment_id?: string
          camera_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          project_id?: string
          strand_id?: string
          strand_role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "camera_fiber_assignment_strands_camera_fiber_assignment_id_fkey"
            columns: ["camera_fiber_assignment_id"]
            isOneToOne: false
            referencedRelation: "camera_fiber_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_fiber_assignment_strands_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "camera_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_fiber_assignment_strands_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_fiber_assignment_strands_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "camera_fiber_assignment_strands_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_fiber_assignment_strands_strand_id_fkey"
            columns: ["strand_id"]
            isOneToOne: true
            referencedRelation: "fiber_strands"
            referencedColumns: ["id"]
          },
        ]
      }
      camera_fiber_assignments: {
        Row: {
          assigned_cabinet_id: string | null
          assigned_fdu_id: string | null
          assigned_fpp_id: string | null
          assigned_sfp_port_id: string | null
          assigned_switch_id: string | null
          assigned_switch_port_id: string | null
          backbone_cable_id: string | null
          camera_id: string
          connectivity_path_type: string
          created_at: string
          drop_cable_id: string | null
          enclosure_id: string | null
          fiber_path_status: string
          id: string
          notes: string | null
          organization_id: string
          project_id: string
          source_node_id: string | null
          splice_status: string
          test_status: string
          updated_at: string | null
        }
        Insert: {
          assigned_cabinet_id?: string | null
          assigned_fdu_id?: string | null
          assigned_fpp_id?: string | null
          assigned_sfp_port_id?: string | null
          assigned_switch_id?: string | null
          assigned_switch_port_id?: string | null
          backbone_cable_id?: string | null
          camera_id: string
          connectivity_path_type?: string
          created_at?: string
          drop_cable_id?: string | null
          enclosure_id?: string | null
          fiber_path_status?: string
          id?: string
          notes?: string | null
          organization_id: string
          project_id: string
          source_node_id?: string | null
          splice_status?: string
          test_status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_cabinet_id?: string | null
          assigned_fdu_id?: string | null
          assigned_fpp_id?: string | null
          assigned_sfp_port_id?: string | null
          assigned_switch_id?: string | null
          assigned_switch_port_id?: string | null
          backbone_cable_id?: string | null
          camera_id?: string
          connectivity_path_type?: string
          created_at?: string
          drop_cable_id?: string | null
          enclosure_id?: string | null
          fiber_path_status?: string
          id?: string
          notes?: string | null
          organization_id?: string
          project_id?: string
          source_node_id?: string | null
          splice_status?: string
          test_status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "camera_fiber_assignments_assigned_cabinet_id_fkey"
            columns: ["assigned_cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_fiber_assignments_assigned_fdu_id_fkey"
            columns: ["assigned_fdu_id"]
            isOneToOne: false
            referencedRelation: "fiber_distribution_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_fiber_assignments_assigned_fpp_id_fkey"
            columns: ["assigned_fpp_id"]
            isOneToOne: false
            referencedRelation: "fiber_patch_panels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_fiber_assignments_assigned_sfp_port_id_fkey"
            columns: ["assigned_sfp_port_id"]
            isOneToOne: false
            referencedRelation: "switch_ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_fiber_assignments_assigned_switch_id_fkey"
            columns: ["assigned_switch_id"]
            isOneToOne: false
            referencedRelation: "network_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_fiber_assignments_assigned_switch_port_id_fkey"
            columns: ["assigned_switch_port_id"]
            isOneToOne: false
            referencedRelation: "switch_ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_fiber_assignments_backbone_cable_id_fkey"
            columns: ["backbone_cable_id"]
            isOneToOne: false
            referencedRelation: "fiber_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_fiber_assignments_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: true
            referencedRelation: "camera_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_fiber_assignments_drop_cable_id_fkey"
            columns: ["drop_cable_id"]
            isOneToOne: false
            referencedRelation: "fiber_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_fiber_assignments_enclosure_id_fkey"
            columns: ["enclosure_id"]
            isOneToOne: false
            referencedRelation: "fiber_enclosures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_fiber_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_fiber_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "camera_fiber_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_fiber_assignments_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "fiber_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      camera_locations: {
        Row: {
          address_reference: string | null
          asset_condition: Database["public"]["Enums"]["asset_condition"]
          assigned_network_device_id: string | null
          backbone_cable_id: string | null
          backbone_strand_a: number | null
          backbone_strand_b: number | null
          camera_id_tag: string
          camera_model_id: string
          communication_type: Database["public"]["Enums"]["comm_type"]
          condition_source: string | null
          created_at: string
          drop_cable_ft: number | null
          floor_plan_id: string | null
          fov_degrees: number | null
          fov_range_ft: number | null
          heading_degrees: number | null
          id: string
          ip_address: string | null
          ir_range_ft: number | null
          latitude: number
          lens: string | null
          longitude: number
          material_received: boolean
          material_received_at: string | null
          mount_hardware: string | null
          mounting_height_ft: number | null
          notes: string | null
          owner_of_record: string | null
          plan_x: number | null
          plan_y: number | null
          power_type: Database["public"]["Enums"]["power_type"]
          project_id: string
          resolution: string | null
          served_by_cabinet_id: string | null
          show_fov: boolean
          status: Database["public"]["Enums"]["camera_status"]
          structure_reference: string | null
          supplied_by: string | null
          supply_responsibility: Database["public"]["Enums"]["supply_responsibility"]
          updated_at: string
          work_scope: Database["public"]["Enums"]["work_scope"]
        }
        Insert: {
          address_reference?: string | null
          asset_condition?: Database["public"]["Enums"]["asset_condition"]
          assigned_network_device_id?: string | null
          backbone_cable_id?: string | null
          backbone_strand_a?: number | null
          backbone_strand_b?: number | null
          camera_id_tag: string
          camera_model_id: string
          communication_type?: Database["public"]["Enums"]["comm_type"]
          condition_source?: string | null
          created_at?: string
          drop_cable_ft?: number | null
          floor_plan_id?: string | null
          fov_degrees?: number | null
          fov_range_ft?: number | null
          heading_degrees?: number | null
          id?: string
          ip_address?: string | null
          ir_range_ft?: number | null
          latitude: number
          lens?: string | null
          longitude: number
          material_received?: boolean
          material_received_at?: string | null
          mount_hardware?: string | null
          mounting_height_ft?: number | null
          notes?: string | null
          owner_of_record?: string | null
          plan_x?: number | null
          plan_y?: number | null
          power_type?: Database["public"]["Enums"]["power_type"]
          project_id: string
          resolution?: string | null
          served_by_cabinet_id?: string | null
          show_fov?: boolean
          status?: Database["public"]["Enums"]["camera_status"]
          structure_reference?: string | null
          supplied_by?: string | null
          supply_responsibility?: Database["public"]["Enums"]["supply_responsibility"]
          updated_at?: string
          work_scope?: Database["public"]["Enums"]["work_scope"]
        }
        Update: {
          address_reference?: string | null
          asset_condition?: Database["public"]["Enums"]["asset_condition"]
          assigned_network_device_id?: string | null
          backbone_cable_id?: string | null
          backbone_strand_a?: number | null
          backbone_strand_b?: number | null
          camera_id_tag?: string
          camera_model_id?: string
          communication_type?: Database["public"]["Enums"]["comm_type"]
          condition_source?: string | null
          created_at?: string
          drop_cable_ft?: number | null
          floor_plan_id?: string | null
          fov_degrees?: number | null
          fov_range_ft?: number | null
          heading_degrees?: number | null
          id?: string
          ip_address?: string | null
          ir_range_ft?: number | null
          latitude?: number
          lens?: string | null
          longitude?: number
          material_received?: boolean
          material_received_at?: string | null
          mount_hardware?: string | null
          mounting_height_ft?: number | null
          notes?: string | null
          owner_of_record?: string | null
          plan_x?: number | null
          plan_y?: number | null
          power_type?: Database["public"]["Enums"]["power_type"]
          project_id?: string
          resolution?: string | null
          served_by_cabinet_id?: string | null
          show_fov?: boolean
          status?: Database["public"]["Enums"]["camera_status"]
          structure_reference?: string | null
          supplied_by?: string | null
          supply_responsibility?: Database["public"]["Enums"]["supply_responsibility"]
          updated_at?: string
          work_scope?: Database["public"]["Enums"]["work_scope"]
        }
        Relationships: [
          {
            foreignKeyName: "camera_locations_assigned_network_device_id_fkey"
            columns: ["assigned_network_device_id"]
            isOneToOne: false
            referencedRelation: "network_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_locations_backbone_cable_id_fkey"
            columns: ["backbone_cable_id"]
            isOneToOne: false
            referencedRelation: "fiber_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_locations_camera_model_id_fkey"
            columns: ["camera_model_id"]
            isOneToOne: false
            referencedRelation: "camera_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_locations_floor_plan_id_fkey"
            columns: ["floor_plan_id"]
            isOneToOne: false
            referencedRelation: "project_floor_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "camera_locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_locations_served_by_cabinet_id_fkey"
            columns: ["served_by_cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
        ]
      }
      camera_models: {
        Row: {
          created_at: string
          default_poe_draw: number
          estimated_cost: number | null
          form_factor: string | null
          id: string
          lens_type: string | null
          manufacturer: string
          model_number: string
          power_requirements: string | null
          resolution: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          default_poe_draw?: number
          estimated_cost?: number | null
          form_factor?: string | null
          id?: string
          lens_type?: string | null
          manufacturer: string
          model_number: string
          power_requirements?: string | null
          resolution?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          default_poe_draw?: number
          estimated_cost?: number | null
          form_factor?: string | null
          id?: string
          lens_type?: string | null
          manufacturer?: string
          model_number?: string
          power_requirements?: string | null
          resolution?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      camera_task_history: {
        Row: {
          camera_id: string
          camera_task_id: string
          created_at: string
          created_by: string | null
          event_type: string
          id: string
          new_value: string | null
          note: string | null
          old_value: string | null
          organization_id: string
          project_id: string
        }
        Insert: {
          camera_id: string
          camera_task_id: string
          created_at?: string
          created_by?: string | null
          event_type: string
          id?: string
          new_value?: string | null
          note?: string | null
          old_value?: string | null
          organization_id: string
          project_id: string
        }
        Update: {
          camera_id?: string
          camera_task_id?: string
          created_at?: string
          created_by?: string | null
          event_type?: string
          id?: string
          new_value?: string | null
          note?: string | null
          old_value?: string | null
          organization_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "camera_task_history_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "camera_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_task_history_camera_task_id_fkey"
            columns: ["camera_task_id"]
            isOneToOne: false
            referencedRelation: "camera_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_task_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_task_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_task_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "camera_task_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      camera_tasks: {
        Row: {
          assigned_to: string | null
          camera_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          notes: string | null
          organization_id: string
          priority: string
          project_id: string
          project_task_id: string | null
          related_scope_item: string | null
          status: string
          task_type: string
          template_key: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          camera_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          priority?: string
          project_id: string
          project_task_id?: string | null
          related_scope_item?: string | null
          status?: string
          task_type: string
          template_key?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          camera_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          priority?: string
          project_id?: string
          project_task_id?: string | null
          related_scope_item?: string | null
          status?: string
          task_type?: string
          template_key?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "camera_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_tasks_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "camera_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "camera_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_tasks_project_task_id_fkey"
            columns: ["project_task_id"]
            isOneToOne: false
            referencedRelation: "field_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_advances: {
        Row: {
          amount: number
          closed_at: string | null
          created_at: string
          customer_id: string | null
          given_on: string
          id: string
          notes: string | null
          organization_id: string
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          closed_at?: string | null
          created_at?: string
          customer_id?: string | null
          given_on?: string
          id?: string
          notes?: string | null
          organization_id: string
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          closed_at?: string | null
          created_at?: string
          customer_id?: string | null
          given_on?: string
          id?: string
          notes?: string | null
          organization_id?: string
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_advances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_advances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          communication_type: string
          created_at: string
          id: string
          items: Json
          organization_id: string
          updated_at: string
        }
        Insert: {
          communication_type: string
          created_at?: string
          id?: string
          items?: Json
          organization_id: string
          updated_at?: string
        }
        Update: {
          communication_type?: string
          created_at?: string
          id?: string
          items?: Json
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conduit_runs: {
        Row: {
          asset_condition: Database["public"]["Enums"]["asset_condition"]
          condition_source: string | null
          created_at: string
          depth_inches: number | null
          diameter_inches: number
          id: string
          install_method: string
          length_feet: number
          material: string
          material_received: boolean
          material_received_at: string | null
          notes: string | null
          organization_id: string
          owner_of_record: string | null
          project_id: string
          route_id: string | null
          run_tag: string
          status: string
          supplied_by: string | null
          supply_responsibility: Database["public"]["Enums"]["supply_responsibility"]
          surface_type: string
          updated_at: string | null
          ways: number
          work_scope: Database["public"]["Enums"]["work_scope"]
        }
        Insert: {
          asset_condition?: Database["public"]["Enums"]["asset_condition"]
          condition_source?: string | null
          created_at?: string
          depth_inches?: number | null
          diameter_inches?: number
          id?: string
          install_method?: string
          length_feet?: number
          material?: string
          material_received?: boolean
          material_received_at?: string | null
          notes?: string | null
          organization_id: string
          owner_of_record?: string | null
          project_id: string
          route_id?: string | null
          run_tag: string
          status?: string
          supplied_by?: string | null
          supply_responsibility?: Database["public"]["Enums"]["supply_responsibility"]
          surface_type?: string
          updated_at?: string | null
          ways?: number
          work_scope?: Database["public"]["Enums"]["work_scope"]
        }
        Update: {
          asset_condition?: Database["public"]["Enums"]["asset_condition"]
          condition_source?: string | null
          created_at?: string
          depth_inches?: number | null
          diameter_inches?: number
          id?: string
          install_method?: string
          length_feet?: number
          material?: string
          material_received?: boolean
          material_received_at?: string | null
          notes?: string | null
          organization_id?: string
          owner_of_record?: string | null
          project_id?: string
          route_id?: string | null
          run_tag?: string
          status?: string
          supplied_by?: string | null
          supply_responsibility?: Database["public"]["Enums"]["supply_responsibility"]
          surface_type?: string
          updated_at?: string | null
          ways?: number
          work_scope?: Database["public"]["Enums"]["work_scope"]
        }
        Relationships: [
          {
            foreignKeyName: "conduit_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conduit_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "conduit_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conduit_runs_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "fiber_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      conduit_structures: {
        Row: {
          asset_condition: Database["public"]["Enums"]["asset_condition"]
          condition_source: string | null
          cover_rating: string | null
          created_at: string
          depth_ft: number | null
          id: string
          latitude: number | null
          longitude: number | null
          material: string | null
          material_received: boolean
          material_received_at: string | null
          node_id: string | null
          notes: string | null
          organization_id: string
          owner_of_record: string | null
          project_id: string
          size_description: string | null
          status: string
          structure_tag: string
          structure_type: string
          supplied_by: string | null
          supply_responsibility: Database["public"]["Enums"]["supply_responsibility"]
          updated_at: string | null
          work_scope: Database["public"]["Enums"]["work_scope"]
        }
        Insert: {
          asset_condition?: Database["public"]["Enums"]["asset_condition"]
          condition_source?: string | null
          cover_rating?: string | null
          created_at?: string
          depth_ft?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          material?: string | null
          material_received?: boolean
          material_received_at?: string | null
          node_id?: string | null
          notes?: string | null
          organization_id: string
          owner_of_record?: string | null
          project_id: string
          size_description?: string | null
          status?: string
          structure_tag: string
          structure_type?: string
          supplied_by?: string | null
          supply_responsibility?: Database["public"]["Enums"]["supply_responsibility"]
          updated_at?: string | null
          work_scope?: Database["public"]["Enums"]["work_scope"]
        }
        Update: {
          asset_condition?: Database["public"]["Enums"]["asset_condition"]
          condition_source?: string | null
          cover_rating?: string | null
          created_at?: string
          depth_ft?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          material?: string | null
          material_received?: boolean
          material_received_at?: string | null
          node_id?: string | null
          notes?: string | null
          organization_id?: string
          owner_of_record?: string | null
          project_id?: string
          size_description?: string | null
          status?: string
          structure_tag?: string
          structure_type?: string
          supplied_by?: string | null
          supply_responsibility?: Database["public"]["Enums"]["supply_responsibility"]
          updated_at?: string | null
          work_scope?: Database["public"]["Enums"]["work_scope"]
        }
        Relationships: [
          {
            foreignKeyName: "conduit_structures_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "fiber_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conduit_structures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conduit_structures_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "conduit_structures_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          amount: number
          contract_number: string | null
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          payment_terms: string
          project_id: string
          signed_date: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number
          contract_number?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          payment_terms?: string
          project_id: string
          signed_date?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          contract_number?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          payment_terms?: string
          project_id?: string
          signed_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_codes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          organization_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_rates: {
        Row: {
          created_at: string
          employment_type: string
          hourly_rate: number
          id: string
          organization_id: string
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          employment_type?: string
          hourly_rate: number
          id?: string
          organization_id: string
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          employment_type?: string
          hourly_rate?: number
          id?: string
          organization_id?: string
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_rates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_rates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enclosure_kit_items: {
        Row: {
          created_at: string
          default_asset_condition: Database["public"]["Enums"]["asset_condition"]
          description: string
          id: string
          kit_id: string
          manufacturer: string | null
          part_number: string
          quantity: number
          role: string
          sort_order: number
          supply_responsibility: Database["public"]["Enums"]["supply_responsibility"]
          unit: string
          unit_cost: number
        }
        Insert: {
          created_at?: string
          default_asset_condition?: Database["public"]["Enums"]["asset_condition"]
          description: string
          id?: string
          kit_id: string
          manufacturer?: string | null
          part_number: string
          quantity?: number
          role?: string
          sort_order?: number
          supply_responsibility?: Database["public"]["Enums"]["supply_responsibility"]
          unit?: string
          unit_cost?: number
        }
        Update: {
          created_at?: string
          default_asset_condition?: Database["public"]["Enums"]["asset_condition"]
          description?: string
          id?: string
          kit_id?: string
          manufacturer?: string | null
          part_number?: string
          quantity?: number
          role?: string
          sort_order?: number
          supply_responsibility?: Database["public"]["Enums"]["supply_responsibility"]
          unit?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "enclosure_kit_items_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "enclosure_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      enclosure_kits: {
        Row: {
          camera_capacity: number
          code: string
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          organization_id: string | null
          pigtail_count: number
          poe_budget_watts: number
          sfp_uplink_count: number
          strands_spliced: number
          switch_port_count: number
          updated_at: string | null
        }
        Insert: {
          camera_capacity?: number
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          organization_id?: string | null
          pigtail_count?: number
          poe_budget_watts?: number
          sfp_uplink_count?: number
          strands_spliced?: number
          switch_port_count?: number
          updated_at?: string | null
        }
        Update: {
          camera_capacity?: number
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string | null
          pigtail_count?: number
          poe_budget_watts?: number
          sfp_uplink_count?: number
          strands_spliced?: number
          switch_port_count?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enclosure_kits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fiber_assignment_strands: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          organization_id: string
          project_id: string
          strand_id: string
          strand_role: string
          updated_at: string | null
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          organization_id: string
          project_id: string
          strand_id: string
          strand_role?: string
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          project_id?: string
          strand_id?: string
          strand_role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiber_assignment_strands_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "fiber_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_assignment_strands_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_assignment_strands_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fiber_assignment_strands_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_assignment_strands_strand_id_fkey"
            columns: ["strand_id"]
            isOneToOne: true
            referencedRelation: "fiber_strands"
            referencedColumns: ["id"]
          },
        ]
      }
      fiber_assignments: {
        Row: {
          assigned_fdu_id: string | null
          assigned_fpp_id: string | null
          assigned_sfp_port_id: string | null
          assigned_switch_port_id: string | null
          backbone_cable_id: string | null
          cabinet_id: string | null
          camera_id: string | null
          connectivity_path_type: string
          created_at: string
          drop_cable_id: string | null
          enclosure_id: string | null
          fiber_path_status: string
          id: string
          notes: string | null
          organization_id: string
          project_id: string
          purpose: string
          source_node_id: string | null
          splice_status: string
          switch_id: string | null
          test_status: string
          updated_at: string | null
        }
        Insert: {
          assigned_fdu_id?: string | null
          assigned_fpp_id?: string | null
          assigned_sfp_port_id?: string | null
          assigned_switch_port_id?: string | null
          backbone_cable_id?: string | null
          cabinet_id?: string | null
          camera_id?: string | null
          connectivity_path_type?: string
          created_at?: string
          drop_cable_id?: string | null
          enclosure_id?: string | null
          fiber_path_status?: string
          id?: string
          notes?: string | null
          organization_id: string
          project_id: string
          purpose: string
          source_node_id?: string | null
          splice_status?: string
          switch_id?: string | null
          test_status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_fdu_id?: string | null
          assigned_fpp_id?: string | null
          assigned_sfp_port_id?: string | null
          assigned_switch_port_id?: string | null
          backbone_cable_id?: string | null
          cabinet_id?: string | null
          camera_id?: string | null
          connectivity_path_type?: string
          created_at?: string
          drop_cable_id?: string | null
          enclosure_id?: string | null
          fiber_path_status?: string
          id?: string
          notes?: string | null
          organization_id?: string
          project_id?: string
          purpose?: string
          source_node_id?: string | null
          splice_status?: string
          switch_id?: string | null
          test_status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiber_assignments_assigned_fdu_id_fkey"
            columns: ["assigned_fdu_id"]
            isOneToOne: false
            referencedRelation: "fiber_distribution_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_assignments_assigned_fpp_id_fkey"
            columns: ["assigned_fpp_id"]
            isOneToOne: false
            referencedRelation: "fiber_patch_panels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_assignments_assigned_sfp_port_id_fkey"
            columns: ["assigned_sfp_port_id"]
            isOneToOne: false
            referencedRelation: "switch_ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_assignments_assigned_switch_port_id_fkey"
            columns: ["assigned_switch_port_id"]
            isOneToOne: false
            referencedRelation: "switch_ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_assignments_backbone_cable_id_fkey"
            columns: ["backbone_cable_id"]
            isOneToOne: false
            referencedRelation: "fiber_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_assignments_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_assignments_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "camera_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_assignments_drop_cable_id_fkey"
            columns: ["drop_cable_id"]
            isOneToOne: false
            referencedRelation: "fiber_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_assignments_enclosure_id_fkey"
            columns: ["enclosure_id"]
            isOneToOne: false
            referencedRelation: "fiber_enclosures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fiber_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_assignments_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "fiber_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_assignments_switch_id_fkey"
            columns: ["switch_id"]
            isOneToOne: false
            referencedRelation: "network_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      fiber_buffer_tubes: {
        Row: {
          cable_id: string
          created_at: string
          id: string
          organization_id: string
          project_id: string
          strand_end: number
          strand_start: number
          tube_color: string
          tube_number: number
          updated_at: string | null
        }
        Insert: {
          cable_id: string
          created_at?: string
          id?: string
          organization_id: string
          project_id: string
          strand_end: number
          strand_start: number
          tube_color: string
          tube_number: number
          updated_at?: string | null
        }
        Update: {
          cable_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          project_id?: string
          strand_end?: number
          strand_start?: number
          tube_color?: string
          tube_number?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiber_buffer_tubes_cable_id_fkey"
            columns: ["cable_id"]
            isOneToOne: false
            referencedRelation: "fiber_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_buffer_tubes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_buffer_tubes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fiber_buffer_tubes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      fiber_cable_pass_throughs: {
        Row: {
          cable_id: string
          created_at: string
          has_slack_loop: boolean
          id: string
          node_id: string
          notes: string | null
          organization_id: string
          project_id: string
          sequence_order: number
          slack_length_ft: number
          strand_from: number | null
          strand_to: number | null
          updated_at: string | null
        }
        Insert: {
          cable_id: string
          created_at?: string
          has_slack_loop?: boolean
          id?: string
          node_id: string
          notes?: string | null
          organization_id: string
          project_id: string
          sequence_order: number
          slack_length_ft?: number
          strand_from?: number | null
          strand_to?: number | null
          updated_at?: string | null
        }
        Update: {
          cable_id?: string
          created_at?: string
          has_slack_loop?: boolean
          id?: string
          node_id?: string
          notes?: string | null
          organization_id?: string
          project_id?: string
          sequence_order?: number
          slack_length_ft?: number
          strand_from?: number | null
          strand_to?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiber_cable_pass_throughs_cable_id_fkey"
            columns: ["cable_id"]
            isOneToOne: false
            referencedRelation: "fiber_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_cable_pass_throughs_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "fiber_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_cable_pass_throughs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_cable_pass_throughs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fiber_cable_pass_throughs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      fiber_cables: {
        Row: {
          asset_condition: Database["public"]["Enums"]["asset_condition"]
          cable_tag: string
          cable_type: string
          condition_source: string | null
          created_at: string
          fiber_count: number
          from_node_id: string | null
          id: string
          install_status: string
          length_ft: number
          manufacturer: string | null
          material_received: boolean
          material_received_at: string | null
          model: string | null
          notes: string | null
          organization_id: string
          owner_of_record: string | null
          project_id: string
          route_id: string | null
          status: string | null
          strand_count: number | null
          supplied_by: string | null
          supply_responsibility: Database["public"]["Enums"]["supply_responsibility"]
          test_status: string
          to_node_id: string | null
          updated_at: string | null
          work_scope: Database["public"]["Enums"]["work_scope"]
        }
        Insert: {
          asset_condition?: Database["public"]["Enums"]["asset_condition"]
          cable_tag: string
          cable_type: string
          condition_source?: string | null
          created_at?: string
          fiber_count: number
          from_node_id?: string | null
          id?: string
          install_status?: string
          length_ft?: number
          manufacturer?: string | null
          material_received?: boolean
          material_received_at?: string | null
          model?: string | null
          notes?: string | null
          organization_id: string
          owner_of_record?: string | null
          project_id: string
          route_id?: string | null
          status?: string | null
          strand_count?: number | null
          supplied_by?: string | null
          supply_responsibility?: Database["public"]["Enums"]["supply_responsibility"]
          test_status?: string
          to_node_id?: string | null
          updated_at?: string | null
          work_scope?: Database["public"]["Enums"]["work_scope"]
        }
        Update: {
          asset_condition?: Database["public"]["Enums"]["asset_condition"]
          cable_tag?: string
          cable_type?: string
          condition_source?: string | null
          created_at?: string
          fiber_count?: number
          from_node_id?: string | null
          id?: string
          install_status?: string
          length_ft?: number
          manufacturer?: string | null
          material_received?: boolean
          material_received_at?: string | null
          model?: string | null
          notes?: string | null
          organization_id?: string
          owner_of_record?: string | null
          project_id?: string
          route_id?: string | null
          status?: string | null
          strand_count?: number | null
          supplied_by?: string | null
          supply_responsibility?: Database["public"]["Enums"]["supply_responsibility"]
          test_status?: string
          to_node_id?: string | null
          updated_at?: string | null
          work_scope?: Database["public"]["Enums"]["work_scope"]
        }
        Relationships: [
          {
            foreignKeyName: "fiber_cables_from_node_id_fkey"
            columns: ["from_node_id"]
            isOneToOne: false
            referencedRelation: "fiber_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_cables_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_cables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fiber_cables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_cables_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "fiber_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_cables_to_node_id_fkey"
            columns: ["to_node_id"]
            isOneToOne: false
            referencedRelation: "fiber_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      fiber_catalog: {
        Row: {
          cost_per_foot: number
          cost_per_meter: number
          created_at: string
          diameter_mm: number
          fiber_count: number
          grade: string
          id: string
          manufacturer: string
          mode: string
          part_number: string
          updated_at: string | null
          weight_kg_km: number
        }
        Insert: {
          cost_per_foot: number
          cost_per_meter: number
          created_at?: string
          diameter_mm: number
          fiber_count: number
          grade: string
          id?: string
          manufacturer: string
          mode: string
          part_number: string
          updated_at?: string | null
          weight_kg_km: number
        }
        Update: {
          cost_per_foot?: number
          cost_per_meter?: number
          created_at?: string
          diameter_mm?: number
          fiber_count?: number
          grade?: string
          id?: string
          manufacturer?: string
          mode?: string
          part_number?: string
          updated_at?: string | null
          weight_kg_km?: number
        }
        Relationships: []
      }
      fiber_distribution_units: {
        Row: {
          assigned_backbone_cable_id: string | null
          cabinet_id: string | null
          created_at: string
          fdu_tag: string
          fiber_capacity: number
          id: string
          organization_id: string
          project_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          assigned_backbone_cable_id?: string | null
          cabinet_id?: string | null
          created_at?: string
          fdu_tag: string
          fiber_capacity?: number
          id?: string
          organization_id: string
          project_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_backbone_cable_id?: string | null
          cabinet_id?: string | null
          created_at?: string
          fdu_tag?: string
          fiber_capacity?: number
          id?: string
          organization_id?: string
          project_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiber_distribution_units_assigned_backbone_cable_id_fkey"
            columns: ["assigned_backbone_cable_id"]
            isOneToOne: false
            referencedRelation: "fiber_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_distribution_units_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_distribution_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_distribution_units_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fiber_distribution_units_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      fiber_enclosure_attachments: {
        Row: {
          cable_id: string
          created_at: string
          enclosure_id: string
          id: string
          label: string | null
          port_number: number
          updated_at: string | null
        }
        Insert: {
          cable_id: string
          created_at?: string
          enclosure_id: string
          id?: string
          label?: string | null
          port_number?: number
          updated_at?: string | null
        }
        Update: {
          cable_id?: string
          created_at?: string
          enclosure_id?: string
          id?: string
          label?: string | null
          port_number?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      fiber_enclosures: {
        Row: {
          asset_condition: Database["public"]["Enums"]["asset_condition"]
          cabinet_id: string | null
          capacity: number
          created_at: string
          enclosure_tag: string
          enclosure_type: string
          id: string
          installed_status: string
          latitude: number | null
          longitude: number | null
          material_received: boolean
          material_received_at: string | null
          node_id: string
          notes: string | null
          organization_id: string
          part_number: string | null
          project_id: string
          role: string
          splice_count: number
          supplied_by: string | null
          supply_responsibility: Database["public"]["Enums"]["supply_responsibility"]
          updated_at: string | null
          work_scope: Database["public"]["Enums"]["work_scope"]
        }
        Insert: {
          asset_condition?: Database["public"]["Enums"]["asset_condition"]
          cabinet_id?: string | null
          capacity?: number
          created_at?: string
          enclosure_tag: string
          enclosure_type: string
          id?: string
          installed_status?: string
          latitude?: number | null
          longitude?: number | null
          material_received?: boolean
          material_received_at?: string | null
          node_id: string
          notes?: string | null
          organization_id: string
          part_number?: string | null
          project_id: string
          role?: string
          splice_count?: number
          supplied_by?: string | null
          supply_responsibility?: Database["public"]["Enums"]["supply_responsibility"]
          updated_at?: string | null
          work_scope?: Database["public"]["Enums"]["work_scope"]
        }
        Update: {
          asset_condition?: Database["public"]["Enums"]["asset_condition"]
          cabinet_id?: string | null
          capacity?: number
          created_at?: string
          enclosure_tag?: string
          enclosure_type?: string
          id?: string
          installed_status?: string
          latitude?: number | null
          longitude?: number | null
          material_received?: boolean
          material_received_at?: string | null
          node_id?: string
          notes?: string | null
          organization_id?: string
          part_number?: string | null
          project_id?: string
          role?: string
          splice_count?: number
          supplied_by?: string | null
          supply_responsibility?: Database["public"]["Enums"]["supply_responsibility"]
          updated_at?: string | null
          work_scope?: Database["public"]["Enums"]["work_scope"]
        }
        Relationships: [
          {
            foreignKeyName: "fiber_enclosures_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_enclosures_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "fiber_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_enclosures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_enclosures_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fiber_enclosures_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      fiber_hardware_catalog: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          manufacturer: string
          part_number: string
          unit: string
          unit_cost: number
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          manufacturer?: string
          part_number: string
          unit?: string
          unit_cost: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          manufacturer?: string
          part_number?: string
          unit?: string
          unit_cost?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      fiber_nodes: {
        Row: {
          address: string | null
          asset_condition: Database["public"]["Enums"]["asset_condition"]
          condition_source: string | null
          created_at: string
          elevation_ft: number
          id: string
          latitude: number
          longitude: number
          node_tag: string
          node_type: string
          notes: string | null
          organization_id: string
          owner_of_record: string | null
          project_id: string
          size_description: string
          slack_loop_ft: number
          status: string
          structure_depth_ft: number
          updated_at: string | null
          work_scope: Database["public"]["Enums"]["work_scope"]
        }
        Insert: {
          address?: string | null
          asset_condition?: Database["public"]["Enums"]["asset_condition"]
          condition_source?: string | null
          created_at?: string
          elevation_ft?: number
          id?: string
          latitude: number
          longitude: number
          node_tag: string
          node_type: string
          notes?: string | null
          organization_id: string
          owner_of_record?: string | null
          project_id: string
          size_description?: string
          slack_loop_ft?: number
          status?: string
          structure_depth_ft?: number
          updated_at?: string | null
          work_scope?: Database["public"]["Enums"]["work_scope"]
        }
        Update: {
          address?: string | null
          asset_condition?: Database["public"]["Enums"]["asset_condition"]
          condition_source?: string | null
          created_at?: string
          elevation_ft?: number
          id?: string
          latitude?: number
          longitude?: number
          node_tag?: string
          node_type?: string
          notes?: string | null
          organization_id?: string
          owner_of_record?: string | null
          project_id?: string
          size_description?: string
          slack_loop_ft?: number
          status?: string
          structure_depth_ft?: number
          updated_at?: string | null
          work_scope?: Database["public"]["Enums"]["work_scope"]
        }
        Relationships: [
          {
            foreignKeyName: "fiber_nodes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_nodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fiber_nodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      fiber_patch_cords: {
        Row: {
          connector_a: string | null
          connector_b: string | null
          created_at: string
          from_fdu_id: string | null
          from_fpp_id: string | null
          id: string
          jumper_type: string
          length_feet: number
          notes: string | null
          organization_id: string
          patch_cord_tag: string
          polarity: string | null
          project_id: string
          status: string
          to_fpp_id: string | null
          to_port_id: string | null
          updated_at: string | null
        }
        Insert: {
          connector_a?: string | null
          connector_b?: string | null
          created_at?: string
          from_fdu_id?: string | null
          from_fpp_id?: string | null
          id?: string
          jumper_type: string
          length_feet?: number
          notes?: string | null
          organization_id: string
          patch_cord_tag: string
          polarity?: string | null
          project_id: string
          status?: string
          to_fpp_id?: string | null
          to_port_id?: string | null
          updated_at?: string | null
        }
        Update: {
          connector_a?: string | null
          connector_b?: string | null
          created_at?: string
          from_fdu_id?: string | null
          from_fpp_id?: string | null
          id?: string
          jumper_type?: string
          length_feet?: number
          notes?: string | null
          organization_id?: string
          patch_cord_tag?: string
          polarity?: string | null
          project_id?: string
          status?: string
          to_fpp_id?: string | null
          to_port_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiber_patch_cords_from_fdu_id_fkey"
            columns: ["from_fdu_id"]
            isOneToOne: false
            referencedRelation: "fiber_distribution_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_patch_cords_from_fpp_id_fkey"
            columns: ["from_fpp_id"]
            isOneToOne: false
            referencedRelation: "fiber_patch_panels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_patch_cords_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_patch_cords_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fiber_patch_cords_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_patch_cords_to_fpp_id_fkey"
            columns: ["to_fpp_id"]
            isOneToOne: false
            referencedRelation: "fiber_patch_panels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_patch_cords_to_port_id_fkey"
            columns: ["to_port_id"]
            isOneToOne: false
            referencedRelation: "switch_ports"
            referencedColumns: ["id"]
          },
        ]
      }
      fiber_patch_panels: {
        Row: {
          assigned_fdu_id: string | null
          cabinet_id: string | null
          created_at: string
          fpp_tag: string
          id: string
          organization_id: string
          port_count: number
          project_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          assigned_fdu_id?: string | null
          cabinet_id?: string | null
          created_at?: string
          fpp_tag: string
          id?: string
          organization_id: string
          port_count?: number
          project_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_fdu_id?: string | null
          cabinet_id?: string | null
          created_at?: string
          fpp_tag?: string
          id?: string
          organization_id?: string
          port_count?: number
          project_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiber_patch_panels_assigned_fdu_id_fkey"
            columns: ["assigned_fdu_id"]
            isOneToOne: false
            referencedRelation: "fiber_distribution_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_patch_panels_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_patch_panels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_patch_panels_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fiber_patch_panels_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      fiber_route_segments: {
        Row: {
          created_at: string
          end_latitude: number
          end_longitude: number
          id: string
          length_feet: number
          organization_id: string
          project_id: string
          route_id: string
          segment_index: number
          slack_feet: number
          start_latitude: number
          start_longitude: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          end_latitude: number
          end_longitude: number
          id?: string
          length_feet?: number
          organization_id: string
          project_id: string
          route_id: string
          segment_index: number
          slack_feet?: number
          start_latitude: number
          start_longitude: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          end_latitude?: number
          end_longitude?: number
          id?: string
          length_feet?: number
          organization_id?: string
          project_id?: string
          route_id?: string
          segment_index?: number
          slack_feet?: number
          start_latitude?: number
          start_longitude?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiber_route_segments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_route_segments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fiber_route_segments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_route_segments_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "fiber_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      fiber_routes: {
        Row: {
          asset_condition: Database["public"]["Enums"]["asset_condition"]
          condition_source: string | null
          conduit_diameter_inches: number
          created_at: string
          fill_percentage: number
          id: string
          installation_type: string
          installed_length_feet: number
          measured_length_feet: number
          organization_id: string
          owner_of_record: string | null
          project_id: string
          route_id_tag: string
          route_purpose: string
          slack_percentage: number
          spare_capacity: number
          technical_reserve_ft: number
          updated_at: string | null
          work_scope: Database["public"]["Enums"]["work_scope"]
        }
        Insert: {
          asset_condition?: Database["public"]["Enums"]["asset_condition"]
          condition_source?: string | null
          conduit_diameter_inches?: number
          created_at?: string
          fill_percentage?: number
          id?: string
          installation_type?: string
          installed_length_feet?: number
          measured_length_feet?: number
          organization_id: string
          owner_of_record?: string | null
          project_id: string
          route_id_tag: string
          route_purpose?: string
          slack_percentage?: number
          spare_capacity?: number
          technical_reserve_ft?: number
          updated_at?: string | null
          work_scope?: Database["public"]["Enums"]["work_scope"]
        }
        Update: {
          asset_condition?: Database["public"]["Enums"]["asset_condition"]
          condition_source?: string | null
          conduit_diameter_inches?: number
          created_at?: string
          fill_percentage?: number
          id?: string
          installation_type?: string
          installed_length_feet?: number
          measured_length_feet?: number
          organization_id?: string
          owner_of_record?: string | null
          project_id?: string
          route_id_tag?: string
          route_purpose?: string
          slack_percentage?: number
          spare_capacity?: number
          technical_reserve_ft?: number
          updated_at?: string | null
          work_scope?: Database["public"]["Enums"]["work_scope"]
        }
        Relationships: [
          {
            foreignKeyName: "fiber_routes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_routes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fiber_routes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      fiber_splice_records: {
        Row: {
          assigned_camera_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          enclosure_id: string
          from_cable_id: string
          from_strand_id: string
          id: string
          notes: string | null
          organization_id: string
          project_id: string
          splice_loss_db: number | null
          splice_status: string
          splice_type: string
          test_status: string
          to_cable_id: string
          to_strand_id: string
          tray_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_camera_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          enclosure_id: string
          from_cable_id: string
          from_strand_id: string
          id?: string
          notes?: string | null
          organization_id: string
          project_id: string
          splice_loss_db?: number | null
          splice_status?: string
          splice_type?: string
          test_status?: string
          to_cable_id: string
          to_strand_id: string
          tray_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_camera_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          enclosure_id?: string
          from_cable_id?: string
          from_strand_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          project_id?: string
          splice_loss_db?: number | null
          splice_status?: string
          splice_type?: string
          test_status?: string
          to_cable_id?: string
          to_strand_id?: string
          tray_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiber_splice_records_assigned_camera_id_fkey"
            columns: ["assigned_camera_id"]
            isOneToOne: false
            referencedRelation: "camera_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_splice_records_enclosure_id_fkey"
            columns: ["enclosure_id"]
            isOneToOne: false
            referencedRelation: "fiber_enclosures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_splice_records_from_cable_id_fkey"
            columns: ["from_cable_id"]
            isOneToOne: false
            referencedRelation: "fiber_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_splice_records_from_strand_id_fkey"
            columns: ["from_strand_id"]
            isOneToOne: false
            referencedRelation: "fiber_strands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_splice_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_splice_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fiber_splice_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_splice_records_to_cable_id_fkey"
            columns: ["to_cable_id"]
            isOneToOne: false
            referencedRelation: "fiber_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_splice_records_to_strand_id_fkey"
            columns: ["to_strand_id"]
            isOneToOne: false
            referencedRelation: "fiber_strands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_splice_records_tray_id_fkey"
            columns: ["tray_id"]
            isOneToOne: false
            referencedRelation: "splice_trays"
            referencedColumns: ["id"]
          },
        ]
      }
      fiber_strands: {
        Row: {
          assigned_camera_id: string | null
          assigned_purpose: string | null
          buffer_tube_id: string | null
          cable_id: string
          created_at: string
          fiber_color: string
          id: string
          notes: string | null
          organization_id: string
          project_id: string
          splice_status: string
          status: string
          strand_color: string | null
          strand_number: number
          test_status: string
          tube_color: string
          updated_at: string | null
        }
        Insert: {
          assigned_camera_id?: string | null
          assigned_purpose?: string | null
          buffer_tube_id?: string | null
          cable_id: string
          created_at?: string
          fiber_color: string
          id?: string
          notes?: string | null
          organization_id: string
          project_id: string
          splice_status?: string
          status?: string
          strand_color?: string | null
          strand_number: number
          test_status?: string
          tube_color: string
          updated_at?: string | null
        }
        Update: {
          assigned_camera_id?: string | null
          assigned_purpose?: string | null
          buffer_tube_id?: string | null
          cable_id?: string
          created_at?: string
          fiber_color?: string
          id?: string
          notes?: string | null
          organization_id?: string
          project_id?: string
          splice_status?: string
          status?: string
          strand_color?: string | null
          strand_number?: number
          test_status?: string
          tube_color?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiber_strands_assigned_camera_id_fkey"
            columns: ["assigned_camera_id"]
            isOneToOne: false
            referencedRelation: "camera_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_strands_buffer_tube_id_fkey"
            columns: ["buffer_tube_id"]
            isOneToOne: false
            referencedRelation: "fiber_buffer_tubes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_strands_cable_id_fkey"
            columns: ["cable_id"]
            isOneToOne: false
            referencedRelation: "fiber_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_strands_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_strands_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fiber_strands_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      field_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          project_id: string
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "field_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          contract_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          issue_date: string
          organization_id: string
          project_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          contract_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string
          organization_id: string
          project_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          contract_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string
          organization_id?: string
          project_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      labor_invoices: {
        Row: {
          created_at: string
          customer_id: string | null
          detail: Json
          id: string
          invoice_date: string
          invoice_number: string
          labor_subtotal: number
          notes: string | null
          organization_id: string
          other_or_tax: number
          paid_on: string | null
          payment_terms: string | null
          period_from: string
          period_to: string
          project_or_po: string | null
          reimbursements: number
          status: string
          total: number
          total_hours: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          detail?: Json
          id?: string
          invoice_date: string
          invoice_number: string
          labor_subtotal?: number
          notes?: string | null
          organization_id: string
          other_or_tax?: number
          paid_on?: string | null
          payment_terms?: string | null
          period_from: string
          period_to: string
          project_or_po?: string | null
          reimbursements?: number
          status?: string
          total?: number
          total_hours?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          detail?: Json
          id?: string
          invoice_date?: string
          invoice_number?: string
          labor_subtotal?: number
          notes?: string | null
          organization_id?: string
          other_or_tax?: number
          paid_on?: string | null
          payment_terms?: string | null
          period_from?: string
          period_to?: string
          project_or_po?: string | null
          reimbursements?: number
          status?: string
          total?: number
          total_hours?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "labor_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labor_invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      labor_rates: {
        Row: {
          applies_to_scope: Database["public"]["Enums"]["work_scope"]
          code: string
          created_at: string
          description: string
          id: string
          is_default: boolean
          module: Database["public"]["Enums"]["bom_module"]
          notes: string | null
          organization_id: string | null
          rate: number
          structure_type: string | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          applies_to_scope: Database["public"]["Enums"]["work_scope"]
          code: string
          created_at?: string
          description: string
          id?: string
          is_default?: boolean
          module?: Database["public"]["Enums"]["bom_module"]
          notes?: string | null
          organization_id?: string | null
          rate?: number
          structure_type?: string | null
          unit?: string
          updated_at?: string | null
        }
        Update: {
          applies_to_scope?: Database["public"]["Enums"]["work_scope"]
          code?: string
          created_at?: string
          description?: string
          id?: string
          is_default?: boolean
          module?: Database["public"]["Enums"]["bom_module"]
          notes?: string | null
          organization_id?: string | null
          rate?: number
          structure_type?: string | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "labor_rates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string
          default_monthly_price_cents: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          stripe_price_id: string | null
        }
        Insert: {
          created_at?: string
          default_monthly_price_cents?: number
          description?: string | null
          id: string
          is_active?: boolean
          name: string
          stripe_price_id?: string | null
        }
        Update: {
          created_at?: string
          default_monthly_price_cents?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      network_devices: {
        Row: {
          asset_condition: Database["public"]["Enums"]["asset_condition"]
          cabinet_id: string | null
          condition_source: string | null
          created_at: string
          device_type: Database["public"]["Enums"]["device_type"]
          id: string
          ip_address: string | null
          latitude: number | null
          location_reference: string | null
          longitude: number | null
          manufacturer: string | null
          material_received: boolean
          material_received_at: string | null
          model_number: string | null
          name: string
          owner_of_record: string | null
          poe_budget_watts: number
          project_id: string
          rack_unit: string | null
          status: string
          supplied_by: string | null
          supply_responsibility: Database["public"]["Enums"]["supply_responsibility"]
          total_ports: number | null
          updated_at: string | null
          work_scope: Database["public"]["Enums"]["work_scope"]
        }
        Insert: {
          asset_condition?: Database["public"]["Enums"]["asset_condition"]
          cabinet_id?: string | null
          condition_source?: string | null
          created_at?: string
          device_type?: Database["public"]["Enums"]["device_type"]
          id?: string
          ip_address?: string | null
          latitude?: number | null
          location_reference?: string | null
          longitude?: number | null
          manufacturer?: string | null
          material_received?: boolean
          material_received_at?: string | null
          model_number?: string | null
          name: string
          owner_of_record?: string | null
          poe_budget_watts?: number
          project_id: string
          rack_unit?: string | null
          status?: string
          supplied_by?: string | null
          supply_responsibility?: Database["public"]["Enums"]["supply_responsibility"]
          total_ports?: number | null
          updated_at?: string | null
          work_scope?: Database["public"]["Enums"]["work_scope"]
        }
        Update: {
          asset_condition?: Database["public"]["Enums"]["asset_condition"]
          cabinet_id?: string | null
          condition_source?: string | null
          created_at?: string
          device_type?: Database["public"]["Enums"]["device_type"]
          id?: string
          ip_address?: string | null
          latitude?: number | null
          location_reference?: string | null
          longitude?: number | null
          manufacturer?: string | null
          material_received?: boolean
          material_received_at?: string | null
          model_number?: string | null
          name?: string
          owner_of_record?: string | null
          poe_budget_watts?: number
          project_id?: string
          rack_unit?: string | null
          status?: string
          supplied_by?: string | null
          supply_responsibility?: Database["public"]["Enums"]["supply_responsibility"]
          total_ports?: number | null
          updated_at?: string | null
          work_scope?: Database["public"]["Enums"]["work_scope"]
        }
        Relationships: [
          {
            foreignKeyName: "network_devices_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_devices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "network_devices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_branding: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          license_number: string | null
          logo_data_url: string | null
          organization_id: string
          primary_color: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          license_number?: string | null
          logo_data_url?: string | null
          organization_id: string
          primary_color?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          license_number?: string | null
          logo_data_url?: string | null
          organization_id?: string
          primary_color?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_branding_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          profile_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          profile_id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_modules: {
        Row: {
          canceled_at: string | null
          enabled_at: string
          id: string
          module_id: string
          organization_id: string
          price_cents: number
          status: string
          stripe_subscription_item_id: string | null
        }
        Insert: {
          canceled_at?: string | null
          enabled_at?: string
          id?: string
          module_id: string
          organization_id: string
          price_cents: number
          status?: string
          stripe_subscription_item_id?: string | null
        }
        Update: {
          canceled_at?: string | null
          enabled_at?: string
          id?: string
          module_id?: string
          organization_id?: string
          price_cents?: number
          status?: string
          stripe_subscription_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_modules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          billing_status: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          current_period_end: string | null
          id: string
          logo_url: string | null
          name: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          billing_status?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          logo_url?: string | null
          name: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          billing_status?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          method: string
          notes: string | null
          organization_id: string
          received_at: string
          reference: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id: string
          method?: string
          notes?: string | null
          organization_id: string
          received_at?: string
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: string
          notes?: string | null
          organization_id?: string
          received_at?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cell: string | null
          email: string | null
          email_signature: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_platform_admin: boolean
          last_name: string | null
          phone: string | null
          status: string
          theme_preference: string | null
          time_zone: string
          title: string | null
          updated_at: string | null
          weather_zip: string | null
        }
        Insert: {
          avatar_url?: string | null
          cell?: string | null
          email?: string | null
          email_signature?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          is_platform_admin?: boolean
          last_name?: string | null
          phone?: string | null
          status?: string
          theme_preference?: string | null
          time_zone?: string
          title?: string | null
          updated_at?: string | null
          weather_zip?: string | null
        }
        Update: {
          avatar_url?: string | null
          cell?: string | null
          email?: string | null
          email_signature?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_platform_admin?: boolean
          last_name?: string | null
          phone?: string | null
          status?: string
          theme_preference?: string | null
          time_zone?: string
          title?: string | null
          updated_at?: string | null
          weather_zip?: string | null
        }
        Relationships: []
      }
      project_expenses: {
        Row: {
          advance_id: string | null
          amount: number
          billable: boolean
          category: string
          created_at: string
          description: string
          id: string
          notes: string | null
          organization_id: string
          paid_by: string
          profile_id: string
          project_id: string | null
          receipt_path: string | null
          reimbursed_at: string | null
          spent_on: string
          updated_at: string | null
          vendor: string | null
        }
        Insert: {
          advance_id?: string | null
          amount: number
          billable?: boolean
          category?: string
          created_at?: string
          description: string
          id?: string
          notes?: string | null
          organization_id: string
          paid_by?: string
          profile_id: string
          project_id?: string | null
          receipt_path?: string | null
          reimbursed_at?: string | null
          spent_on?: string
          updated_at?: string | null
          vendor?: string | null
        }
        Update: {
          advance_id?: string | null
          amount?: number
          billable?: boolean
          category?: string
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          organization_id?: string
          paid_by?: string
          profile_id?: string
          project_id?: string | null
          receipt_path?: string | null
          reimbursed_at?: string | null
          spent_on?: string
          updated_at?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_expenses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_floor_plans: {
        Row: {
          created_at: string
          file_path: string
          file_type: string
          floor_label: string
          id: string
          image_height_px: number | null
          image_width_px: number | null
          module: string
          page_number: number
          project_id: string
          scale_calibration: Json | null
          sort_order: number
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_path: string
          file_type: string
          floor_label?: string
          id?: string
          image_height_px?: number | null
          image_width_px?: number | null
          module: string
          page_number?: number
          project_id: string
          scale_calibration?: Json | null
          sort_order?: number
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string
          file_type?: string
          floor_label?: string
          id?: string
          image_height_px?: number | null
          image_width_px?: number | null
          module?: string
          page_number?: number
          project_id?: string
          scale_calibration?: Json | null
          sort_order?: number
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_floor_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_floor_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_pricing: {
        Row: {
          labor_markup_pct: number
          material_markup_pct: number
          organization_id: string
          pricing_mode: string
          project_id: string
          tax_applies_to_labor: boolean
          tax_pct: number
          updated_at: string
        }
        Insert: {
          labor_markup_pct?: number
          material_markup_pct?: number
          organization_id: string
          pricing_mode?: string
          project_id: string
          tax_applies_to_labor?: boolean
          tax_pct?: number
          updated_at?: string
        }
        Update: {
          labor_markup_pct?: number
          material_markup_pct?: number
          organization_id?: string
          pricing_mode?: string
          project_id?: string
          tax_applies_to_labor?: boolean
          tax_pct?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_pricing_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_pricing_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_pricing_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_share_links: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          label: string | null
          last_viewed_at: string | null
          organization_id: string
          password_hash: string
          password_salt: string
          project_id: string
          revoked: boolean
          token: string
          view_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          label?: string | null
          last_viewed_at?: string | null
          organization_id: string
          password_hash: string
          password_salt: string
          project_id: string
          revoked?: boolean
          token: string
          view_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          label?: string | null
          last_viewed_at?: string | null
          organization_id?: string
          password_hash?: string
          password_salt?: string
          project_id?: string
          revoked?: boolean
          token?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_share_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_share_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_share_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_share_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          camera_canvas_mode: string
          created_at: string
          customer_id: string | null
          default_latitude: number
          default_longitude: number
          default_zoom: number
          description: string | null
          disciplines: string[]
          fiber_canvas_mode: string
          id: string
          job_number: string | null
          name: string
          organization_id: string
          parent_id: string | null
          project_section: string
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string | null
        }
        Insert: {
          camera_canvas_mode?: string
          created_at?: string
          customer_id?: string | null
          default_latitude?: number
          default_longitude?: number
          default_zoom?: number
          description?: string | null
          disciplines?: string[]
          fiber_canvas_mode?: string
          id?: string
          job_number?: string | null
          name: string
          organization_id: string
          parent_id?: string | null
          project_section?: string
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string | null
        }
        Update: {
          camera_canvas_mode?: string
          created_at?: string
          customer_id?: string | null
          default_latitude?: number
          default_longitude?: number
          default_zoom?: number
          description?: string | null
          disciplines?: string[]
          fiber_canvas_mode?: string
          id?: string
          job_number?: string | null
          name?: string
          organization_id?: string
          parent_id?: string | null
          project_section?: string
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "projects_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      splice_trays: {
        Row: {
          capacity: number
          created_at: string
          enclosure_id: string
          id: string
          notes: string | null
          organization_id: string
          project_id: string
          tray_number: number
          updated_at: string | null
        }
        Insert: {
          capacity?: number
          created_at?: string
          enclosure_id: string
          id?: string
          notes?: string | null
          organization_id: string
          project_id: string
          tray_number: number
          updated_at?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string
          enclosure_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          project_id?: string
          tray_number?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "splice_trays_enclosure_id_fkey"
            columns: ["enclosure_id"]
            isOneToOne: false
            referencedRelation: "fiber_enclosures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "splice_trays_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "splice_trays_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "splice_trays_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      switch_ports: {
        Row: {
          assigned_camera_location_id: string | null
          assigned_device_type: Database["public"]["Enums"]["port_assignment_type"]
          assigned_fiber_cable_id: string | null
          assigned_fiber_strand_id: string | null
          created_at: string
          id: string
          network_device_id: string
          poe_budget_watts: number
          poe_enabled: boolean
          port_name: string | null
          port_number: number
          port_type: Database["public"]["Enums"]["port_media_type"]
          speed_mbps: number
          status: string
          updated_at: string | null
          vlan_id: number
        }
        Insert: {
          assigned_camera_location_id?: string | null
          assigned_device_type?: Database["public"]["Enums"]["port_assignment_type"]
          assigned_fiber_cable_id?: string | null
          assigned_fiber_strand_id?: string | null
          created_at?: string
          id?: string
          network_device_id: string
          poe_budget_watts?: number
          poe_enabled?: boolean
          port_name?: string | null
          port_number: number
          port_type?: Database["public"]["Enums"]["port_media_type"]
          speed_mbps?: number
          status?: string
          updated_at?: string | null
          vlan_id?: number
        }
        Update: {
          assigned_camera_location_id?: string | null
          assigned_device_type?: Database["public"]["Enums"]["port_assignment_type"]
          assigned_fiber_cable_id?: string | null
          assigned_fiber_strand_id?: string | null
          created_at?: string
          id?: string
          network_device_id?: string
          poe_budget_watts?: number
          poe_enabled?: boolean
          port_name?: string | null
          port_number?: number
          port_type?: Database["public"]["Enums"]["port_media_type"]
          speed_mbps?: number
          status?: string
          updated_at?: string | null
          vlan_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "switch_ports_assigned_camera_location_id_fkey"
            columns: ["assigned_camera_location_id"]
            isOneToOne: true
            referencedRelation: "camera_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "switch_ports_assigned_fiber_cable_id_fkey"
            columns: ["assigned_fiber_cable_id"]
            isOneToOne: false
            referencedRelation: "fiber_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "switch_ports_assigned_fiber_strand_id_fkey"
            columns: ["assigned_fiber_strand_id"]
            isOneToOne: false
            referencedRelation: "fiber_strands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "switch_ports_network_device_id_fkey"
            columns: ["network_device_id"]
            isOneToOne: false
            referencedRelation: "network_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          clock_in: string
          clock_out: string | null
          cost_code_id: string | null
          created_at: string
          id: string
          organization_id: string
          paused_at: string | null
          paused_minutes: number
          profile_id: string
          project_id: string | null
          updated_at: string | null
          work_description: string | null
        }
        Insert: {
          clock_in?: string
          clock_out?: string | null
          cost_code_id?: string | null
          created_at?: string
          id?: string
          organization_id: string
          paused_at?: string | null
          paused_minutes?: number
          profile_id: string
          project_id?: string | null
          updated_at?: string | null
          work_description?: string | null
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          cost_code_id?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          paused_at?: string | null
          paused_minutes?: number
          profile_id?: string
          project_id?: string | null
          updated_at?: string | null
          work_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_cost_code_id_fkey"
            columns: ["cost_code_id"]
            isOneToOne: false
            referencedRelation: "cost_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      project_cost_summary: {
        Row: {
          billable_total: number | null
          labor: number | null
          material_contractor: number | null
          material_owner_furnished: number | null
          ofci_lines: number | null
          ofci_pending_delivery: number | null
          project_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bom_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "bom_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_financial_summary: {
        Row: {
          contract_amount: number | null
          customer_id: string | null
          invoiced: number | null
          organization_id: string | null
          overdue: number | null
          paid: number | null
          project_id: string | null
          receivable: number | null
          remaining_to_bill: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_user_sign_in_stats: {
        Args: never
        Returns: {
          active_sessions: number
          created_at: string
          email: string
          full_name: string
          last_sign_in_at: string
          organization_names: string[]
          sign_in_count: number
          user_id: string
        }[]
      }
      assign_camera_to_switch_port: {
        Args: { camera_id: string; switch_port_id: string }
        Returns: undefined
      }
      auth_route_context: {
        Args: never
        Returns: {
          is_platform_admin: boolean
          workspace_blocked: boolean
        }[]
      }
      is_org_admin: {
        Args: { org_id: string; user_id: string }
        Returns: boolean
      }
      is_org_editor_or_above: {
        Args: { org_id: string; user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { org_id: string; user_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { user_id: string }; Returns: boolean }
      payroll_employee_detail: {
        Args: {
          p_from: string
          p_organization_id: string
          p_profile_id: string
          p_to: string
        }
        Returns: {
          clock_in: string
          clock_out: string
          entry_id: string
          hours: number
          paused_minutes: number
          project_name: string
          week_start: string
          work_day: string
          work_description: string
        }[]
      }
      payroll_summary: {
        Args: { p_from: string; p_organization_id: string; p_to: string }
        Returns: {
          employee_name: string
          employment_type: string
          hourly_rate: number
          overtime_cost: number
          overtime_hours: number
          profile_id: string
          regular_cost: number
          regular_hours: number
          total_cost: number
          total_hours: number
          week_start: string
        }[]
      }
      reconcile_pending_invites: {
        Args: never
        Returns: {
          member_role: Database["public"]["Enums"]["user_role"]
          organization_id: string
          organization_name: string
        }[]
      }
      unassign_camera_from_switch_port: {
        Args: { camera_id: string }
        Returns: undefined
      }
      update_fiber_strand_utilization_status_for_id: {
        Args: { p_strand_id: string }
        Returns: undefined
      }
      weekly_timecard_summary: {
        Args: { p_organization_id: string; p_week_start?: string }
        Returns: {
          employee_name: string
          employment_type: string
          hourly_rate: number
          overtime_cost: number
          overtime_hours: number
          profile_id: string
          regular_cost: number
          regular_hours: number
          total_cost: number
          total_hours: number
          week_start: string
        }[]
      }
    }
    Enums: {
      asset_condition: "existing" | "new" | "unknown"
      bom_module:
        | "cctv"
        | "conduit"
        | "fiber"
        | "enclosure"
        | "network"
        | "power"
        | "lighting"
        | "wireless"
        | "traffic"
        | "tower"
        | "general"
      bom_source_type: "catalog" | "custom"
      camera_status:
        | "planned"
        | "in_progress"
        | "complete"
        | "issue"
        | "unknown"
      comm_type: "copper" | "fiber" | "wireless"
      device_type:
        | "switch"
        | "nvr"
        | "router"
        | "patch_panel"
        | "other"
        | "cabinet_device"
        | "Industrial Switch"
        | "Wireless Radio"
        | "UPS"
        | "Media Converter"
        | "Power Supply"
        | "Custom"
      fiber_node_type:
        | "handhole"
        | "pull_box"
        | "splice_enclosure"
        | "cabinet"
        | "building_entry"
      port_assignment_type:
        | "camera"
        | "device"
        | "uplink"
        | "unused"
        | "downlink"
        | "management"
        | "unassigned"
      port_media_type:
        | "copper"
        | "fiber"
        | "rj45"
        | "sfp"
        | "sfp_plus"
        | "qsfp"
        | "fiber_uplink"
        | "fiber_lc"
      power_type: "poe" | "poe+" | "local" | "solar"
      project_status:
        | "planning"
        | "in_progress"
        | "on_hold"
        | "completed"
        | "closed"
      route_purpose:
        | "camera_backbone"
        | "camera_drop"
        | "network_backbone"
        | "power_monitoring"
        | "spare"
      splice_status: "planned" | "installed" | "tested" | "abandoned"
      supply_responsibility: "contractor" | "owner" | "other_contractor"
      task_status: "pending" | "in_progress" | "completed" | "blocked"
      user_role: "owner" | "admin" | "member" | "editor" | "viewer" | "employee"
      work_scope:
        | "reference"
        | "reuse"
        | "modify"
        | "install"
        | "replace"
        | "remove"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      asset_condition: ["existing", "new", "unknown"],
      bom_module: [
        "cctv",
        "conduit",
        "fiber",
        "enclosure",
        "network",
        "power",
        "lighting",
        "wireless",
        "traffic",
        "tower",
        "general",
      ],
      bom_source_type: ["catalog", "custom"],
      camera_status: ["planned", "in_progress", "complete", "issue", "unknown"],
      comm_type: ["copper", "fiber", "wireless"],
      device_type: [
        "switch",
        "nvr",
        "router",
        "patch_panel",
        "other",
        "cabinet_device",
        "Industrial Switch",
        "Wireless Radio",
        "UPS",
        "Media Converter",
        "Power Supply",
        "Custom",
      ],
      fiber_node_type: [
        "handhole",
        "pull_box",
        "splice_enclosure",
        "cabinet",
        "building_entry",
      ],
      port_assignment_type: [
        "camera",
        "device",
        "uplink",
        "unused",
        "downlink",
        "management",
        "unassigned",
      ],
      port_media_type: [
        "copper",
        "fiber",
        "rj45",
        "sfp",
        "sfp_plus",
        "qsfp",
        "fiber_uplink",
        "fiber_lc",
      ],
      power_type: ["poe", "poe+", "local", "solar"],
      project_status: [
        "planning",
        "in_progress",
        "on_hold",
        "completed",
        "closed",
      ],
      route_purpose: [
        "camera_backbone",
        "camera_drop",
        "network_backbone",
        "power_monitoring",
        "spare",
      ],
      splice_status: ["planned", "installed", "tested", "abandoned"],
      supply_responsibility: ["contractor", "owner", "other_contractor"],
      task_status: ["pending", "in_progress", "completed", "blocked"],
      user_role: ["owner", "admin", "member", "editor", "viewer", "employee"],
      work_scope: [
        "reference",
        "reuse",
        "modify",
        "install",
        "replace",
        "remove",
      ],
    },
  },
} as const
