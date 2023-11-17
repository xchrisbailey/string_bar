import { redirect } from 'sveltekit-flash-message/server';
import type { Actions, PageServerLoad } from './$types';
import db from '$lib/db';
import { superValidate } from 'sveltekit-superforms/server';
import { schema } from './schema';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
	const { locals, params } = event;
	const session = await locals.auth.validate();
	if (!session) throw redirect(302, '/login');

	const review = await db.review.findFirst({
		where: { user_id: session.user.userId },
		include: { string: true, user: true }
	});

	if (!review) {
		throw redirect(
			302,
			`/string/${params.id}`,
			{
				type: 'error',
				message: 'You have not reviewed this string yet.'
			},
			event
		);
	}
	return {
		form: superValidate(review, schema)
	};
};

export const actions = {
	default: async (event) => {
		const { locals, request, params } = event;
		const session = await locals.auth.validate();
		if (!session) throw redirect(302, '/login');

		const form = await superValidate(request, schema);
		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await db.review.update({
				where: { id: params.id, user_id: session.user.userId },
				data: form.data
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
