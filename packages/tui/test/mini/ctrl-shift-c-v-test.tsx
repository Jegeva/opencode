/** @jsxImportSource @opentui/solid */
import { expect, test } from "bun:test"
import { testRender } from "@opentui/solid"
import { createSignal } from "solid-js"
import { Keymap } from "../../src/context/keymap"
import type { ClipboardService } from "../../src/context/clipboard"
import { RunFooterView } from "../../src/mini/footer.view"
import { RUN_THEME_FALLBACK } from "../../src/mini/theme"
import { resolveMiniSettings } from "../../src/mini/runtime.boot"
import type { FooterState, FooterSubagentState, MiniSettings, RunPrompt, FooterView } from "../../src/mini/types"
import { createTuiResolvedConfig } from "../fixture/tui-runtime"

const tuiConfig = createTuiResolvedConfig()

function footerState(input: Partial<FooterState> = {}) {
  return createSignal<FooterState>({
    phase: "idle",
    status: "",
    notice: "",
    model: "gpt-5",
    usage: undefined,
    first: false,
    interrupt: 0,
    exit: 0,
    ...input,
  })
}

function subagentState(input: Partial<FooterSubagentState> = {}) {
  return createSignal<FooterSubagentState>({
    tabs: [],
    details: {},
    permissions: [],
    forms: [],
    ...input,
  })
}

async function renderFooter(
  input: {
    clipboard?: Pick<ClipboardService, "read" | "write">
    onSubmit?: (prompt: RunPrompt) => boolean | Promise<boolean>
    onInterrupt?: () => boolean
    onExit?: () => void
    state?: Partial<FooterState>
    view?: FooterView
    width?: number
    height?: number
    mono?: boolean
  } = {},
) {
  const [view, setView] = createSignal<FooterView>(input.view ?? { type: "prompt" })
  const [subagents] = subagentState()
  const [state, setState] = footerState(input.state)
  const [miniSettings] = createSignal<MiniSettings>(resolveMiniSettings())

  function Harness() {
    return (
      <Keymap.Provider config={tuiConfig}>
        <RunFooterView
          directory={() => "/tmp"}
          findFiles={async () => []}
          agents={() => []}
          references={() => []}
          commands={() => []}
          providers={() => []}
          currentAgent={() => "Build"}
          currentAgentID={() => "build"}
          currentModel={() => undefined}
          variants={() => []}
          currentVariant={() => undefined}
          state={state}
          view={view}
          subagent={subagents}
          queuedPrompts={() => []}
          theme={() => RUN_THEME_FALLBACK}
          tuiConfig={tuiConfig}
          mono={input.mono ?? false}
          miniSettings={miniSettings}
          onSubmit={input.onSubmit ?? (() => true)}
          clipboard={input.clipboard}
          history={() => []}
          onPermissionReply={() => {}}
          onFormReply={() => {}}
          onFormCancel={() => {}}
          onCycle={() => {}}
          onInterrupt={input.onInterrupt ?? (() => false)}
          onQueuedPromptAction={async () => {}}
          onEditorOpen={async () => undefined}
          onInputClear={() => {}}
          onExit={input.onExit ?? (() => {})}
          onAgentSelect={() => {}}
          onModelSelect={() => {}}
          onVariantSelect={() => {}}
          onRows={() => {}}
          onLayout={() => {}}
          onStatus={() => {}}
          onMiniSettingChange={() => {}}
        />
      </Keymap.Provider>
    )
  }

  const app = await testRender(
    () => (
      <box width={input.width ?? 100} height={input.height ?? 8}>
        <Harness />
      </box>
    ),
    { width: input.width ?? 100, height: input.height ?? 8, kittyKeyboard: true, exitOnCtrlC: false },
  )

  return {
    ...app,
    setState,
    cleanup() {
      app.renderer.currentFocusedRenderable?.blur()
      app.renderer.currentFocusedEditor?.blur()
      app.renderer.destroy()
    },
  }
}

test("ctrl+shift+c does not trigger exit", async () => {
  let exitCalled = false
  const app = await renderFooter({
    onExit: () => {
      exitCalled = true
    },
    width: 80,
    height: 24,
  })
  try {
    await app.renderOnce()
    app.mockInput.pressKey("c", { ctrl: true, shift: true })
    await app.renderOnce()
    expect(exitCalled).toBe(false)
  } finally {
    app.cleanup()
  }
})

test("ctrl+shift+v does not trigger exit", async () => {
  let exitCalled = false
  const app = await renderFooter({
    onExit: () => {
      exitCalled = true
    },
    width: 80,
    height: 24,
  })
  try {
    await app.renderOnce()
    app.mockInput.pressKey("v", { ctrl: true, shift: true })
    await app.renderOnce()
    expect(exitCalled).toBe(false)
  } finally {
    app.cleanup()
  }
})

test("ctrl+c does not trigger exit when shift is pressed", async () => {
  let exitCalled = false
  const app = await renderFooter({
    onExit: () => {
      exitCalled = true
    },
    width: 80,
    height: 24,
  })
  try {
    await app.renderOnce()
    app.mockInput.pressKey("c", { ctrl: true, shift: true })
    await app.renderOnce()
    expect(exitCalled).toBe(false)
  } finally {
    app.cleanup()
  }
})

test("ctrl+c clears prompt when no shift", async () => {
  let exitCalled = false
  const app = await renderFooter({
    onExit: () => {
      exitCalled = true
    },
    width: 80,
    height: 24,
  })
  try {
    await app.renderOnce()
    await app.mockInput.typeText("test")
    await app.renderOnce()
    app.mockInput.pressKey("c", { ctrl: true })
    await app.renderOnce()
    expect(exitCalled).toBe(false)
    const editor = app.renderer.currentFocusedEditor
    expect(editor?.plainText).toBe("")
  } finally {
    app.cleanup()
  }
})
