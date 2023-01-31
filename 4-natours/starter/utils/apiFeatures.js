class APIFeatures {
    // query for Mongoose operation, query object comes from request
    constructor(queryMong, queryReq) {
        this.queryMong = queryMong;
        this.queryReq = queryReq;
    }

    filter() {
        // 1A) Filter
        const queryObj = { ...this.queryReq };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach((el) => delete queryObj[el]);

        // 1B) Advanced Filter
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

        this.queryMong = this.queryMong.find(JSON.parse(queryStr));

        return this;
    }

    sort() {
        if (this.queryReq.sort) {
            // comma is what we place between multiple sort options, space is what Mongoose identify as multiple sort options
            const sortBy = this.queryReq.sort.split(',').join(' ');
            this.queryMong = this.queryMong.sort(sortBy);
        } else {
            this.queryMong = this.queryMong.sort('-createdAt');
        }

        return this;
    }

    limitFields() {
        if (this.queryReq.fields) {
            const fields = this.queryReq.fields.split(',').join(' ');
            this.queryMong = this.queryMong.select(fields);
        } else {
            // minus means excluding that field
            this.queryMong = this.queryMong.select('-__v');
        }

        return this;
    }

    paginate() {
        const page = this.queryReq.page * 1 || 1;
        const limit = this.queryReq.limit * 1 || 5;
        const skip = (page - 1) * limit;
        this.queryMong = this.queryMong.skip(skip).limit(limit);

        return this;
    }
}

module.exports = APIFeatures;
