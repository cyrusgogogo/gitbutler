import { butlerModule } from "$lib/state/butlerModule";
import { ReduxTag } from "$lib/state/tags";
import { configureStore } from "@reduxjs/toolkit";
import { buildCreateApi, coreModule } from "@reduxjs/toolkit/query";
import { describe, expect, test, vi } from "vitest";
import type { TauriBaseQueryFn } from "$lib/state/backendQuery";
import type { HookContext } from "$lib/state/context";

function setup() {
	const ctx: HookContext = {
		getState: () => store.getState(),
		getDispatch: () => store.dispatch,
	};
	async function baseQuery(
		args: Parameters<TauriBaseQueryFn>[0],
		_api: Parameters<TauriBaseQueryFn>[1],
		_extraOptions: Parameters<TauriBaseQueryFn>[2],
	): Promise<Awaited<ReturnType<TauriBaseQueryFn>>> {
		if ((args as { fail?: boolean } | undefined)?.fail) {
			return { error: { origin: "ipc", name: "API error", message: "it broke" } };
		}
		return { data: undefined };
	}
	const api = buildCreateApi(
		coreModule(),
		butlerModule(ctx),
	)({
		reducerPath: "backend",
		tagTypes: Object.values(ReduxTag),
		baseQuery,
		endpoints: (build) => ({
			unnamedMutation: build.mutation<void, { fail?: boolean }>({
				extraOptions: { command: "some_command" },
				query: (args) => args,
			}),
			namedMutation: build.mutation<void, { fail?: boolean }>({
				extraOptions: { command: "some_command", actionName: "Some Action" },
				query: (args) => args,
			}),
		}),
	});
	const store = configureStore({
		reducer: { [api.reducerPath]: api.reducer },
		middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
	});
	return { api };
}

describe("local mutation lifecycle", () => {
	test("preserves successful mutation callbacks", async () => {
		const { api } = setup();
		const sideEffect = vi.fn();
		const preEffect = vi.fn();
		await api.endpoints.namedMutation.mutate({}, { sideEffect, preEffect });
		expect(preEffect).toHaveBeenCalledWith({});
		expect(sideEffect).toHaveBeenCalledWith(undefined, {});
	});
	test("preserves backend failure and invokes the error callback", async () => {
		const { api } = setup();
		const onError = vi.fn();
		const sideEffect = vi.fn();
		await expect(
			api.endpoints.unnamedMutation.mutate({ fail: true }, { onError, sideEffect }),
		).rejects.toMatchObject({ message: "it broke" });
		expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "it broke" }), {
			fail: true,
		});
		expect(sideEffect).not.toHaveBeenCalled();
	});
	test("keeps already handled failures silent", async () => {
		const { api } = setup();
		await expect(
			api.endpoints.unnamedMutation.mutate({ fail: true }, { throwSilentError: true }),
		).rejects.toMatchObject({ name: "SilentError", message: "it broke" });
	});
});
