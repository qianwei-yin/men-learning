function resolveAfter2Seconds(x) {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(x);
		}, 2000);
	});
}

async function f1() {
	const x = await resolveAfter2Seconds(10);
	console.log(x); // 10

	console.log('hello from async function');
}

console.log('hello at the beginning');
f1();
console.log('hello');
