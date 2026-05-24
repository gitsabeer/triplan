// search-data.model.ts

export class SearchData {
  from: string;
  to: string;
  departDate: string;
  returnDate: string;
  travelers: number;
  budget: 'low' | 'moderate' | 'high' | string;
  interests: string[];

  constructor(data: any = {}) {
    this.from = data.from || '';
    this.to = data.to || '';
    this.departDate = data.departDate || '';
    this.returnDate = data.returnDate || '';
    this.travelers = data.travelers || 1;
    this.budget = data.budget || 'moderate';
    this.interests = data.interests || [];
  }

  createPayload() {

    const formatDate = (date: any): string => {
      if (!date) return '';
      try {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return String(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (e) {
        return String(date);
      }
    };

    const dataObj = {
      from: this.from,
      to: this.to,
      departDate: formatDate(this.departDate),
      returnDate: formatDate(this.returnDate),
      travelers: this.travelers,
      budget: this.budget,
      interests: this.interests
    };
    return dataObj;
  }
}
