
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class EditStateService {

	private _isExpanded = false;
	protected _isExpandedSubject: Subject<boolean> = new Subject<boolean>();
	
	constructor() {}

	get isExpanded$(): Observable<boolean> {
		return this._isExpandedSubject.asObservable();
	}

	get isExpanded(): boolean {
		return this._isExpanded;
	}

	next(value: boolean): void {
		this._isExpandedSubject.next(value);
		this._isExpanded = value;
	}
}
