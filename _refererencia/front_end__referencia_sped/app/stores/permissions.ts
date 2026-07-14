import { defineStore } from "pinia";

export const usePermissionsStore = defineStore("permissions", {
  state: () => ({
    permissions: [] as string[],
    loaded: false,
  }),

  actions: {
    async fetchPermissions() {
      if (this.loaded) return;

      const client = useSupabaseClient();

      try {
        const {
          data: { user },
          error: userError,
        } = await client.auth.getUser();

        if (userError) {
          console.warn("Unable to verify authenticated user:", userError);
          this.permissions = [];
          return;
        }

        if (!user?.id) {
          console.warn("User not authenticated, skipping permissions fetch");
          this.permissions = [];
          return;
        }

        const { data: userExpandido, error: userExpandidoError } = (await client
          .from("user_expandido")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle()) as { data: { id: string } | null; error: any };

        if (userExpandidoError) {
          console.error(
            "Error fetching user_expandido for permissions:",
            userExpandidoError,
          );
          this.permissions = [];
          return;
        }

        if (!userExpandido) {
          console.warn("User expandido not found, skipping permissions fetch");
          this.permissions = [];
          return;
        }

        const { data, error } = await (client as any).rpc(
          "app_get_user_permissions",
          {
            p_user_id: userExpandido.id,
          },
        );

        if (error) {
          console.error("RPC error fetching permissions:", error);
          this.permissions = [];
        } else {
          this.permissions = data || [];
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
        this.permissions = [];
      } finally {
        this.loaded = true;
      }
    },

    can(key: string) {
      // If permissions not loaded, maybe safer to return false, or fetch?
      // For UI rendering, likely called in template, so instant return needed.
      if (!this.loaded && this.permissions.length === 0) {
        // Option: Try to fetch if not loading? But better to pre-fetch in middleware/app.vue
        return false;
      }
      // Admin override if needed, or included in DB list.
      // We assume DB list is authoritative.
      return this.permissions.includes(key);
    },

    reset() {
      this.permissions = [];
      this.loaded = false;
    },
  },
});
