let dndType = $state<string | null>(null);

export const dragAndDropNodeType = {
	get current() {
		return dndType;
	},
	set current(value) {
		dndType = value;
	}
};
