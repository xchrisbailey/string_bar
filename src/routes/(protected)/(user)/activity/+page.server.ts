import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) {
		throw redirect(302, '/login');
	}

	const reviews = await locals.db.review.findMany({
		where: {
			user_id: session.user.userId
		}
	});

	return {
		reviews
	};
};
