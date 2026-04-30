import { Extension } from '@tiptap/core'

const MAX_INDENT = 8

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    paragraphIndent: {
      increaseParagraphIndent: () => ReturnType
      decreaseParagraphIndent: () => ReturnType
    }
  }
}

export const ParagraphIndent = Extension.create({
  name: 'paragraphIndent',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const raw = element.getAttribute('data-indent')
              if (raw == null) return 0
              const n = parseInt(raw, 10)
              return Number.isFinite(n) ? Math.min(Math.max(n, 0), MAX_INDENT) : 0
            },
            renderHTML: (attributes) => {
              const n = attributes.indent as number
              if (!n || n < 1) return {}
              return {
                'data-indent': String(n),
                style: `margin-left: ${n * 1.5}em`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      increaseParagraphIndent:
        () =>
        ({ editor, commands }) => {
          const { state } = editor
          const { $from } = state.selection
          const depth = $from.depth
          const node = $from.node(depth)
          if (node.type.name !== 'paragraph') return false
          const cur = Number(node.attrs.indent) || 0
          if (cur >= MAX_INDENT) return false
          return commands.updateAttributes('paragraph', { indent: cur + 1 })
        },
      decreaseParagraphIndent:
        () =>
        ({ editor, commands }) => {
          const { state } = editor
          const { $from } = state.selection
          const depth = $from.depth
          const node = $from.node(depth)
          if (node.type.name !== 'paragraph') return false
          const cur = Number(node.attrs.indent) || 0
          if (cur <= 0) return false
          return commands.updateAttributes('paragraph', { indent: cur - 1 })
        },
    }
  },
})
