export const globals = {
	channels:{
		globals:2,
		jbmh:4,
		suns:3,
		mic:5,
		sfx:6,
	},
	path:'F:\\Sector Live\\Projects\\Audio\\recorded',
	// glob:'**/Fake MIDI GrandMA.mid',
	glob:'**/*OSC SUNRIGS.mid',
	renameOutputFile: (name:string /* only name, extension will be auto-appended */) => {
		return name + ' OSC'
	}

}