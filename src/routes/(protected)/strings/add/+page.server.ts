import type { Brand } from '@prisma/client';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import type { Actions, PageServerLoad } from './$types';
import { schema } from './schema';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) throw redirect(302, '/login');

	const brands: Brand[] = await locals.db.brand.findMany({});

	const form = await superValidate(schema);

	return {
		form,
		brands
	};
};

export const actions = {
	default: async ({ request, locals }) => {
		const session = await locals.auth.validate();
		if (!session) throw redirect(301, '/login');

		const form = await superValidate(request, schema);
		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await locals.db.tennisString.create({
				data: {
					name: form.data.name,
					Brand: {
						connect: {
							id: form.data.brand
						}
					},
					description: form.data.description,
					material: form.data.material
				}
			});

			return { form };
		} catch (err) {
			console.error(err);
			if (err instanceof Error) {
				return fail(500, { message: err.message });
			} else {
				return fail(500, { message: 'Unknown error' });
			}
		}
	}
} satisfies Actions;
