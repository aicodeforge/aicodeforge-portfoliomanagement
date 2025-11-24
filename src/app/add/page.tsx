"use client";

import AssetForm from "@/components/AssetForm";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function AddAssetPage() {
	const searchParams = useSearchParams();
	const isEdit = !!searchParams.get('id');

	return (
		<div className="container">
			<div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
				<Link href="/" style={{ color: 'var(--primary)', fontSize: '17px', marginRight: 'auto' }}>
					Cancel
				</Link>
				<h1 style={{ fontSize: '17px', fontWeight: '600', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
					{isEdit ? 'Edit Asset' : 'Add Asset'}
				</h1>
			</div>
			<AssetForm />
		</div>
	);
}
