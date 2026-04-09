export interface User {
	id: number;
	username: string;
	cpf: string;
	name: string;
	avatar_url: string;
	roles: Role[];
	biography: unknown;
	phone: string;
	phone_prefix: string;
	avatar_id: number;
	nationality: string;
	facebook_url: unknown;
	whatsapp: string;
	instagram_url: string;
	linkedin_url: string;
	not_junior: boolean;
	phone_string: string;
	updated_at: string;
	last_sign_in_at: string;
	user_profile_id: number;
	birthdate: string;
	email: string;
	secondary_email: string;
	personal_info_completion: number;
	avatar: Avatar;
	junior: Junior;
	user_profile: UserProfile;
	locations: Location[];
	emails: Email[];
}

export interface Role {
	id: number;
	user_profile_id: number;
	resource_type: string;
	resource_id: number;
	name: string;
	start_at: string;
	end_at: unknown;
	created_at: string;
	updated_at: string;
	deleted_at: unknown;
	current: boolean;
	occupation_area?: string;
	deprecated_name: unknown;
	membership_id: number;
	resource: Resource;
	substantive: string;
	group: Group;
	data: string;
}

export interface Resource {
	id: number;
	name: string;
	federation_id?: number;
	is_public?: boolean;
	created_at: string;
	updated_at: string;
	diagnosis?: Diagnosis;
	key: string;
	image: Image;
	deleted_at: unknown;
	site_url: string;
	facebook_url: string;
	university_id?: number;
	accepted_terms_at: unknown;
	slug?: string;
	deactivated_at: unknown;
	cover?: Cover;
	logo_application: unknown;
	who_we_are?: string;
	federation_date?: string;
	cnpj: string;
	no_new_members?: boolean;
	status?: string;
	state: string;
	country_id: unknown;
	whatsapp?: string;
	instagram_url: string;
	linkedin_url?: string;
	cluster?: number;
	logo_id: number;
	phone?: string;
	phone_prefix?: string;
	closed_for_new_members_at: unknown;
	dbe_protocol?: DbeProtocol;
	university_cod?: string;
	federation_name?: string;
	core_names?: string;
	logo: string;
	projects_2015?: number;
	meta_projects_2016?: number;
	meta_revenue_2016?: number;
	revenue_2015?: number;
	email?: string;
	meta_ejs?: MetaEjs;
	ejs_amount?: EjsAmount;
	seal_open_at?: string;
	seal_close_at?: string;
	cover_image?: CoverImage;
	partner_id?: number;
	iugu_customer_uid: unknown;
	payments_account_id?: string;
	fantasy_name: unknown;
	legal_nature: unknown;
	tax_regime: unknown;
	municipal_registration: unknown;
	state_registration: unknown;
	special_tax_regime: unknown;
	has_dc?: boolean;
	dc_file_id: unknown;
	dc_password: unknown;
	responsible_name: unknown;
	responsible_cpf: unknown;
	bank: unknown;
	account_type: unknown;
	bank_agency: unknown;
	bank_account: unknown;
	street: unknown;
	complement: unknown;
	city: unknown;
	city_code: unknown;
	zip_code: unknown;
	district: unknown;
	number: unknown;
	country: unknown;
	business_activities: unknown;
	nfe_provider_id: unknown;
	payments_account_verified_at: unknown;
	eventable_meta?: EventableMeta;
	has_cores?: boolean;
}

export type Diagnosis = unknown;

export interface Image {
	url: string;
}

export interface Cover {
	url: unknown;
}

export interface DbeProtocol {
	url: unknown;
}

export interface MetaEjs {
	"2015": string;
	"2016": string;
	"2017": string;
}

export interface EjsAmount {
	"2015": string;
	"2016": string;
}

export interface CoverImage {
	url: string;
}

export interface EventableMeta {
	verified: boolean;
	configured: boolean;
	pix_activated: boolean;
	updated_infos: boolean;
}

export interface Group {
	slug: string;
	name: string;
	icon: string;
	article: Article;
	roles: Role2[];
	resource: Resource2;
}

export interface Article {
	defined: string;
	indefined: string;
}

export interface Role2 {
	slug: string;
	name: string;
	need_key: boolean;
}

export interface Resource2 {
	type: string;
	filters?: Filter[];
	listing: Listing2;
	can_create_if_not_found?: boolean;
	create_data?: CreateData;
}

export interface Filter {
	slug: string;
	key: string;
	name: string;
	icon: string;
	article: Article2;
	listing: Listing;
}

export interface Article2 {
	defined: string;
	indefined: string;
}

export interface Listing {
	url: string;
	params: Params;
}

export interface Params {
	per_page: number;
	q: Q;
}

export interface Q {
	id_not_eq: number;
}

export interface Listing2 {
	mode: string;
	url: string;
	labelKey: string;
	valueKey: string;
	searchKey: string;
}

export interface CreateData {
	statuses: Statuses;
}

export interface Statuses {
	not_federated: string;
	aspirant: string;
	federated: string;
}

export interface Avatar {
	id: number;
	name: unknown;
	content_type: unknown;
	size: unknown;
	file: File;
}

export interface File {
	url: string;
}

export interface Junior {
	id: number;
	course_id: number;
	university_id: number;
	semester: string;
	competences: unknown[];
	competence_list: unknown[];
	course: Course;
	university: University;
}

export interface Course {
	id: number;
	name: string;
	deleted_at: unknown;
	created_at: string;
	updated_at: string;
	cod: string;
	graduation_kind: string;
	kind: string;
	city_cod: number;
	university_cod: string;
	uf_cod: number;
	regs: number;
	regs_fem: number;
	regs_ma: number;
	regs_white: number;
	regs_black: number;
	regs_brown: number;
	regs_yellow: number;
	regs_indian: number;
	regs_pcd: number;
	regs_social: number;
	cod_cine: unknown;
	full_name: string;
}

export interface University {
	id: number;
	name: string;
	deleted_at: unknown;
	created_at: string;
	updated_at: string;
	city: string;
	acronym: string;
	federation_id: number;
	cod: string;
	has_protocol: boolean;
	protocol: Protocol;
	courses_count: number;
	courses_count_with_ejs: number;
	campi_number: string;
	logo: Logo;
	ejs_responsible_area: string;
	site_url: string;
	administrative_category: number;
	academic_organization: number;
	logo_media_id: unknown;
	protocol_media_id: unknown;
	regs: number;
	regs_fem: number;
	regs_ma: number;
	regs_white: number;
	regs_black: number;
	regs_brown: number;
	regs_yellow: number;
	regs_indian: number;
	regs_pcd: number;
	regs_social: number;
	name_with_acronym: string;
	acronym_or_name: string;
}

export interface Protocol {
	url: unknown;
}

export interface Logo {
	url: string;
	thumb_sm: ThumbSm;
	thumb: Thumb;
	thumb_md: ThumbMd;
	thumb_fill_sm: ThumbFillSm;
	thumb_fill: ThumbFill;
	thumb_fill_md: ThumbFillMd;
}

export interface ThumbSm {
	url: string;
}

export interface Thumb {
	url: string;
}

export interface ThumbMd {
	url: string;
}

export interface ThumbFillSm {
	url: string;
}

export interface ThumbFill {
	url: string;
}

export interface ThumbFillMd {
	url: string;
}

export interface UserProfile {
	id: number;
	name: string;
	cpf: string;
	email: string;
	avatar_url: string;
	created_at: string;
	updated_at: string;
	deleted_at: unknown;
	user_id: number;
	about: unknown;
	competencies: unknown[];
	available_for_relocation: boolean;
	preferred_opportunity_types: unknown[];
	preferred_locations: unknown[];
	work_arrangements: unknown[];
	lgpd_consent: boolean;
	lgpd_consented_at: unknown;
}

export interface Location {
	id: number;
	complement: string;
	state: string;
	city: string;
	zip_code: string;
	lat: unknown;
	lng: unknown;
	addressable_type: string;
	addressable_id: number;
	district: string;
	number: string;
	country: string;
	default: unknown;
	alias_name: unknown;
	street: string;
}

export interface Email {
	id: number;
	user_id: number;
	email: string;
	primary: boolean;
	created_at: string;
	updated_at: string;
	deleted_at: unknown;
	unconfirmed_email: unknown;
	confirmed_at: string;
}
