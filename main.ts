import { EditorState } from '@codemirror/state';
import { Plugin } from 'obsidian';

const addQuoteOnPaste = (plugin: PasteMasterPlugin) => {
	return EditorState.transactionFilter.of((tr) => {
		if (!tr.docChanged) {
			return tr;
		}

		if (!plugin.isPasting) return tr;
		const changes: { from: number; to: number; insert: string; }[] = [];

		tr.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
			if (inserted.lines <= 1) return;

			if (inserted.sliceString(0, inserted.length).contains('\n>')) return;

			const line = tr.startState.doc.lineAt(fromA);
			if (!line.text.startsWith('>')) return;

			const text = inserted.sliceString(0, inserted.length);
			const quotedText = text.split('\n').map((line, index) => {
				if (index === 0) return line;
				return '> ' + line;
			}).join('\n');
			changes.push({
				from: fromA,
				to: toA,
				insert: quotedText
			});
		});

		if (!changes.length) return tr;

		plugin.isPasting = false;
		return [
			{
				changes,
				userEvent: "input.paste.addQuote",
			}
		];
	});
};


export default class PasteMasterPlugin extends Plugin {
	isPasting = false;

	async onload() {
		this.app.workspace.on('editor-paste', () => {
			this.isPasting = true;
		});
		this.registerEditorExtension([addQuoteOnPaste(this)]);
	}

	onunload() {

	}

}
