import type { RegisteredNodeType } from "@/nodes/types";

let dndType = $state<RegisteredNodeType | null>(null);

export const dragAndDropNodeType = {
	get current() {
		return dndType;
	},
	set current(value) {
		dndType = value;
	}
};
